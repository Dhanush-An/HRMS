import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import {
    LayoutDashboard,
    Calendar,
    Clock,
    FileText,
    LogOut,
    TrendingUp,
    Megaphone,
    File,
    Book,
    CheckCircle2,
    Menu,
    X,
    Building2,
    Home,
    MapPin,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import logo from '../assets/antigraviity logo 2.jpg';

// Geofencing Constants
const BRANCH_LOCATIONS = {
    'Bangalore': { lat: 12.971667, lng: 77.507778 },
    'Chennai': { lat: 13.0827, lng: 80.2707 } // Placeholder for Chennai
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckedOut, setIsCheckedOut] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [clockedInTime, setClockedInTime] = useState('--:--');
    const [clockedOutTime, setClockedOutTime] = useState('--:--');
    const [attendanceId, setAttendanceId] = useState<string | null>(null);
    const [locationStatus, setLocationStatus] = useState<'active' | 'denied' | 'error' | 'idle'>('idle');
    const [lastPosition, setLastPosition] = useState<{ latitude: number, longitude: number } | null>(null);

    // Login Options Modal State
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginOptions, setLoginOptions] = useState({
        workMode: 'Work from Office',
        workLocation: 'Chennai'
    });


    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        console.log(`[DASHBOARD] Mount check - User: ${!!storedUser}, Token: ${!!token}`);

        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                fetchTodayAttendance(parsedUser.id);
                startGlobalTracking(parsedUser.id);
            } catch (err) {
                console.error("[DASHBOARD] Failed to parse user data", err);
                navigate('/login');
            }
        } else {
            console.warn("[DASHBOARD] missing credentials, redirecting to login");
            navigate('/login');
        }
    }, [navigate]);

    const startGlobalTracking = (userId: string) => {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            setLocationStatus('error');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await api.put(`/api/employees/${userId}/location`, {
                        latitude,
                        longitude
                    });
                    setLastPosition({ latitude, longitude });
                    console.log(`[Location Sync] Success: ${latitude}, ${longitude}`);
                    setLocationStatus('active');
                } catch (err) {
                    console.error("Failed to sync location with server:", err);
                    setLocationStatus('error');
                }
            },
            (err) => {
                console.error("Location tracking error:", err.message);
                setLocationStatus('denied');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    };

    const fetchTodayAttendance = async (employeeId: string) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await api.get(`/api/attendance?date=${today}`);
            const data = await res.json();
            const record = data.find((r: any) => r.employeeId === employeeId);

            if (record) {
                setAttendanceId(record.id);
                setClockedInTime(record.checkIn || '--:--');
                setClockedOutTime(record.checkOut || '--:--');
                if (record.checkOut) {
                    setIsCheckedIn(false);
                    setIsCheckedOut(true);
                } else {
                    setIsCheckedIn(true);
                    setIsCheckedOut(false);
                }
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    const handleCheckIn = () => {
        setIsLoginModalOpen(true);
    };

    const confirmCheckIn = async () => {
        if (!user) return;
        setIsSubmitting(true);

        // Capture Geolocation at Moment of Login
        let loginLocation: { latitude?: number; longitude?: number } = { latitude: undefined, longitude: undefined };

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000 // Increased timeout to 10s
                });
            });
            loginLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
        } catch (err: any) {
            console.warn("Could not capture immediate login location, trying cache:", err);

            // Fallback to last known position if available
            if (lastPosition) {
                console.log("[GEOFENCE] Using cached position as fallback");
                loginLocation = {
                    latitude: lastPosition.latitude,
                    longitude: lastPosition.longitude
                };
            } else if (loginOptions.workMode === 'Work from Office') {
                let errorMessage = "Location Error: We could not verify your position.";
                if (err.code === 1) { // PERMISSION_DENIED
                    errorMessage = "Location Denied: Please enable GPS and allow location access in your browser settings to check-in from the office.";
                } else if (err.code === 3) { // TIMEOUT
                    errorMessage = "Location Timeout: GPS signal is weak. Please try again or move to an area with better reception.";
                } else {
                    errorMessage = "Location Error: Office login requires GPS access. Please ensure your location is enabled.";
                }
                alert(errorMessage);
                setIsSubmitting(false);
                return;
            }
        }

        // GEOFENCING LOGIC (Using either direct or fallback location)
        if (loginOptions.workMode === 'Work from Office' && loginLocation.latitude && loginLocation.longitude) {
            const branch = BRANCH_LOCATIONS[loginOptions.workLocation as keyof typeof BRANCH_LOCATIONS];
            if (branch) {
                const distance = calculateDistance(
                    loginLocation.latitude,
                    loginLocation.longitude,
                    branch.lat,
                    branch.lng
                );

                console.log(`[GEOFENCE] Distance to ${loginOptions.workLocation} branch: ${distance.toFixed(2)}m`);

                if (distance > 500) {
                    alert(`Access Denied: You are ${distance.toFixed(0)}m away. You must be within 500m of the office to check-in.`);
                    setIsSubmitting(false);
                    return;
                }
            }
        } else if (loginOptions.workMode === 'Work from Office' && !loginLocation.latitude) {
            // This case should be handled by the catch block above, but as a safety measure:
            alert("Location required: Please enable GPS to check-in from the office.");
            setIsSubmitting(false);
            return;
        }

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        const tenThirty = new Date();
        tenThirty.setHours(10, 30, 0, 0);

        const onePM = new Date();
        onePM.setHours(13, 0, 0, 0);

        let status = 'Present';
        if (now > onePM) {
            status = 'Half Day';
        } else if (now > tenThirty) {
            status = 'Late';
        }

        try {
            const today = now.toISOString().split('T')[0];
            const res = await api.post('/api/attendance', {
                employeeId: user.id,
                employeeName: user.name,
                date: today,
                status,
                checkIn: timeString,
                workMode: loginOptions.workMode,
                workLocation: loginOptions.workLocation,
                location: {
                    lat: loginLocation.latitude,
                    lng: loginLocation.longitude
                }
            });
            const data = await res.json();

            setIsCheckedIn(true);
            setClockedInTime(timeString);
            setClockedOutTime('--:--');
            setAttendanceId(data.id);
            setIsLoginModalOpen(false);
        } catch (error) {
            console.error("Error checking in:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCheckOut = async () => {
        if (!attendanceId) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        try {
            let workHours = 0;
            if (clockedInTime !== '--:--') {
                const [inH, inM] = clockedInTime.split(':').map(Number);
                const outH = now.getHours();
                const outM = now.getMinutes();
                workHours = Number(((outH * 60 + outM - (inH * 60 + inM)) / 60).toFixed(2));
            }

            await api.put(`/api/attendance/${attendanceId}`, {
                checkOut: timeString,
                workHours
            });

            setIsCheckedIn(false);
            setIsCheckedOut(true);
            setClockedOutTime(timeString);
        } catch (error) {
            console.error("Error checking out:", error);
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/employee-dashboard' },
        { icon: FileText, label: 'Daily Reports', path: '/employee-dashboard/tasks' },
        { icon: TrendingUp, label: 'Performance', path: '/employee-dashboard/performance' },
        { icon: Calendar, label: 'Attendance', path: '/employee-dashboard/attendance' },
        { icon: Clock, label: 'Leave', path: '/employee-dashboard/leaves' },
        { icon: FileText, label: 'Payroll', path: '/employee-dashboard/payroll' },
        { icon: Megaphone, label: 'Announcements', path: '/employee-dashboard/announcements' },
        { icon: File, label: 'Documents', path: '/employee-dashboard/documents' },
        { icon: Book, label: 'Company Policies', path: '/employee-dashboard/policies' },
    ];

    if (!user) return <div className="h-screen bg-brand-bg text-brand-text flex items-center justify-center font-bold">Loading...</div>;

    return (
        <div className="h-screen bg-brand-bg text-brand-text flex overflow-hidden transition-colors duration-300 relative">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 border-r border-brand-border bg-brand-surface flex flex-col p-6 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:flex",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between mb-10 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-brand-primary to-blue-600">
                                <span className="text-white font-black italic text-lg tracking-tighter">aG</span>
                            </div>
                            <img
                                src={logo}
                                alt="Logo"
                                className="absolute inset-0 w-full h-full object-cover z-10"
                            />
                        </div>
                        <span className="text-xl font-bold text-brand-text tracking-tight">Antigraviity</span>
                    </div>
                    <button
                        className="lg:hidden p-2 hover:bg-brand-bg rounded-lg transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6 text-brand-muted" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto pr-2 no-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                navigate(item.path);
                                setIsSidebarOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                location.pathname === item.path
                                    ? "bg-brand-primary-light text-brand-primary font-semibold shadow-sm"
                                    : "hover:bg-brand-bg text-brand-muted hover:text-brand-text"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-brand-primary" : "group-hover:text-brand-primary")} />
                            <span className={cn(
                                "text-sm",
                                location.pathname === item.path ? "text-brand-primary font-bold" : "text-brand-muted group-hover:text-brand-text transition-colors"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-4 border-t border-brand-border">
                    <div
                        onClick={() => {
                            navigate('/employee-dashboard/profile');
                            setIsSidebarOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-brand-bg border border-brand-border hover:bg-brand-surface hover:shadow-sm transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-blue-400 p-[2px]">
                                <div className="w-full h-full rounded-[10px] bg-brand-surface flex items-center justify-center overflow-hidden">
                                    <span className="text-sm font-bold text-brand-primary tracking-wider uppercase">{user.name?.charAt(0)}</span>
                                </div>
                            </div>
                            <div className="text-left overflow-hidden">
                                <p className="text-sm font-semibold text-brand-text truncate max-w-[120px]">{user.name}</p>
                                <p className="text-xs text-brand-muted truncate max-w-[120px]">{user.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/login');
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group/logout"
                        >
                            <LogOut className="w-5 h-5 text-brand-muted group-hover/logout:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Top Nav Overlay */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-brand-primary to-blue-600">
                                <span className="text-white font-black italic text-xs tracking-tighter">aG</span>
                            </div>
                            <img
                                src={logo}
                                alt="Logo"
                                className="absolute inset-0 w-full h-full object-cover z-10"
                            />
                        </div>
                        <span className="text-lg font-bold text-brand-text tracking-tight">Antigraviity</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-brand-bg rounded-lg transition-colors ring-1 ring-brand-border shadow-sm bg-brand-surface"
                    >
                        <Menu className="w-6 h-6 text-brand-primary" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto relative no-scrollbar bg-brand-bg">
                    {/* Header */}
                    {(location.pathname === '/employee-dashboard' || location.pathname === '/employee-dashboard/') && (
                        <header className="sticky top-0 z-30 flex flex-col items-stretch p-4 md:p-6 border-b border-brand-border bg-brand-bg/80 backdrop-blur-xl gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="text-left">
                                <h2 className="text-lg font-bold text-brand-text leading-tight mb-1">Welcome, {user.name}</h2>
                                <div className="flex items-center gap-3">
                                    <p className="text-xs text-brand-muted uppercase font-bold tracking-widest">{user.role}</p>
                                    <div className="w-1 h-1 bg-brand-border rounded-full" />
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                        locationStatus === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                            locationStatus === 'denied' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                "bg-brand-muted/10 text-brand-muted border-brand-border"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", locationStatus === 'active' ? "bg-emerald-500 animate-pulse" : "bg-brand-muted")} />
                                        {locationStatus === 'active' ? "Location Live" : locationStatus === 'denied' ? "Location Blocked" : "Checking Location"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 px-4 py-2 bg-brand-surface border border-brand-border rounded-xl shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Login</span>
                                        <span className="text-sm font-bold text-brand-text">{clockedInTime}</span>
                                    </div>
                                    <div className="w-[1px] h-8 bg-brand-border" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Logout</span>
                                        <span className="text-sm font-bold text-brand-text">{clockedOutTime}</span>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto flex bg-brand-surface border border-brand-border rounded-xl p-1 gap-1 shadow-sm">
                                    <button
                                        onClick={() => {
                                            if (!isCheckedIn && !isCheckedOut) {
                                                handleCheckIn();
                                            }
                                        }}
                                        disabled={isCheckedIn || isCheckedOut}
                                        className={cn(
                                            "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95",
                                            (isCheckedIn || isCheckedOut)
                                                ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20 opacity-80 cursor-not-allowed"
                                                : "bg-status-approved hover:opacity-90 text-white shadow-lg shadow-status-approved/20"
                                        )}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {isCheckedOut ? "Day Completed" : isCheckedIn ? "Logged In" : "Login"}
                                    </button>
                                    <button
                                        onClick={handleCheckOut}
                                        disabled={!isCheckedIn || isCheckedOut}
                                        className={cn(
                                            "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95",
                                            !isCheckedIn || isCheckedOut
                                                ? "text-brand-muted bg-brand-bg opacity-50 cursor-not-allowed border border-brand-border"
                                                : "bg-status-rejected hover:opacity-90 text-white shadow-lg shadow-status-rejected/20"
                                        )}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {isCheckedOut ? "Logged Out" : "Logout"}
                                    </button>
                                </div>
                            </div>
                        </header>
                    )}

                    <div className="p-4 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Premium Login Modal */}
            <AnimatePresence>
                {isLoginModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            onClick={() => !isSubmitting && setIsLoginModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            <div className="p-8 border-b border-brand-border bg-gradient-to-br from-brand-primary/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-brand-primary rounded-xl shadow-lg shadow-brand-primary/20">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-brand-text tracking-tighter">Attendance Check-in</h3>
                                            <p className="text-brand-muted text-[10px] font-black uppercase tracking-widest mt-0.5 opacity-60">Session Authorization</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => !isSubmitting && setIsLoginModalOpen(false)}
                                        className="p-2 hover:bg-brand-bg rounded-xl transition-colors text-brand-muted hover:text-brand-text"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Work Mode Selection */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-brand-muted uppercase tracking-[0.2em] ml-1">Working Environment</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'Work from Office', icon: Building2, label: 'Office' },
                                            { id: 'Work from Home', icon: Home, label: 'Remote' }
                                        ].map((mode) => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setLoginOptions(prev => ({ ...prev, workMode: mode.id }))}
                                                className={cn(
                                                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group",
                                                    loginOptions.workMode === mode.id
                                                        ? "bg-brand-primary-light border-brand-primary shadow-lg shadow-brand-primary/10"
                                                        : "bg-brand-bg border-brand-border hover:border-brand-primary/50"
                                                )}
                                            >
                                                <mode.icon className={cn(
                                                    "w-6 h-6",
                                                    loginOptions.workMode === mode.id ? "text-brand-primary" : "text-brand-muted group-hover:text-brand-primary"
                                                )} />
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-widest",
                                                    loginOptions.workMode === mode.id ? "text-brand-primary" : "text-brand-muted"
                                                )}>{mode.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Location Selection */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-brand-muted uppercase tracking-[0.2em] ml-1">Assigned Branch</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Chennai', 'Bangalore'].map((loc) => (
                                            <button
                                                key={loc}
                                                onClick={() => setLoginOptions(prev => ({ ...prev, workLocation: loc }))}
                                                className={cn(
                                                    "flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all font-bold",
                                                    loginOptions.workLocation === loc
                                                        ? "bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20"
                                                        : "bg-brand-bg border-brand-border text-brand-muted hover:border-brand-primary/50"
                                                )}
                                            >
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-sm">{loc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-brand-bg/50 border-t border-brand-border flex gap-4">
                                <button
                                    onClick={() => setIsLoginModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 px-6 rounded-2xl border border-brand-border font-black text-[10px] uppercase tracking-widest text-brand-muted hover:bg-brand-surface transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCheckIn}
                                    disabled={isSubmitting}
                                    className="flex-[2] py-4 px-6 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            Authorize & Login
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmployeeDashboard;
