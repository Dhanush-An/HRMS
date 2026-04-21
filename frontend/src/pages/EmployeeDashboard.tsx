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
    Loader2,
    Sun,
    Moon,
    HelpCircle,
    Camera,
    RefreshCw,
    UserCheck
} from 'lucide-react';
import { useRef } from 'react';
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

const formatTimeTo12Hour = (time?: string) => {
    if (!time || time === '--:--') return '--:--';
    try {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
        return time;
    }
};

const calculateWorkingHours = (checkIn?: string, checkOut?: string, dbWorkHours?: number) => {
    if (!checkIn || !checkOut || checkIn === '--:--' || checkOut === '--:--') {
        return dbWorkHours ? `${dbWorkHours.toFixed(1)} hrs` : '--:--';
    }
    try {
        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        
        let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
        if (diffMins < 0) diffMins += 24 * 60;
        
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        return `${hrs}h ${mins}m`;
    } catch {
        return dbWorkHours ? `${dbWorkHours.toFixed(1)} hrs` : '--:--';
    }
};

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(() => {
        const stored = localStorage.getItem('user');
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckedOut, setIsCheckedOut] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [clockedInTime, setClockedInTime] = useState('--:--');
    const [clockedOutTime, setClockedOutTime] = useState('--:--');
    const [attendanceId, setAttendanceId] = useState<string | null>(null);
    const [sessionLocation, setSessionLocation] = useState({ workMode: '', workLocation: '', workHours: 0 });
    const [activeBreak, setActiveBreak] = useState<{ type: 'Break' | 'Lunch', startTime: string } | null>(null);
    const [breakHistory, setBreakHistory] = useState<any[]>([]);

    // Login Options Modal State
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginOptions, setLoginOptions] = useState({
        workMode: 'Work from Office',
        workLocation: 'Chennai',
        shiftType: 'Day Shift'
    });

    // Face Capture State
    const [modalStep, setModalStep] = useState<'options' | 'face-capture'>('options');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [lastValidatedLocation, setLastValidatedLocation] = useState<{ lat?: number; lng?: number } | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);


    const fetchTodayAttendance = async (employeeId: string) => {
        try {
            const now = new Date();
            const tzOffset = now.getTimezoneOffset() * 60000;
            const today = new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
            
            const yesterdayDate = new Date(now.getTime() - 86400000 - tzOffset);
            const yesterday = yesterdayDate.toISOString().split('T')[0];

            const res = await api.get(`/api/attendance?employeeId=${employeeId}&limit=1`);
            const data = await res.json();
            
            if (!Array.isArray(data)) {
                console.warn("[DASHBOARD] Attendance API did not return an array. Backend might be down or returning an error.");
                return;
            }

            const record = data.length > 0 ? data[0] : null;

            if (record) {
                const isOvernightShift = record.date === yesterday && record.shiftType === 'Night Shift' && !record.checkOut;
                
                if (record.date === today || isOvernightShift) {
                    setAttendanceId(record.id);
                    setClockedInTime(record.checkIn || '--:--');
                    setClockedOutTime(record.checkOut || '--:--');
                    setSessionLocation({ workMode: record.workMode || '', workLocation: record.workLocation || '', workHours: record.workHours || 0 });
                    setBreakHistory(record.breaks || []);
                    
                    // Check for ongoing break
                    const ongoing = record.breaks?.find((b: any) => !b.endTime);
                    if (ongoing) {
                        setActiveBreak({ type: ongoing.type, startTime: ongoing.startTime });
                    } else {
                        setActiveBreak(null);
                    }
                    if (record.checkOut) {
                        setIsCheckedIn(false);
                        setIsCheckedOut(true);
                    } else {
                        setIsCheckedIn(true);
                        setIsCheckedOut(false);
                        // Also restore previous shift option if resuming
                        if (record.shiftType === 'Night Shift') {
                            setLoginOptions(prev => ({ ...prev, shiftType: 'Night Shift' }));
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        console.log(`[EMPLOYEE DASHBOARD] Mounted. User in state: ${!!user}, User in localStorage: ${!!storedUser}, Token: ${!!token}`);

        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                fetchTodayAttendance(parsedUser.id);
            } catch (err) {
                console.error("[DASHBOARD] Failed to parse user data", err);
                // ProtectedRoute will handle redirect if token is invalid
            }
        }
        // ProtectedRoute handles auth guard — no need to navigate here
    }, []); // Empty deps: only run once on mount

    const handleCheckIn = () => {
        setModalStep('options');
        setCapturedImage(null);
        setIsLoginModalOpen(true);
    };

    const closeModal = () => {
        if (!isSubmitting) {
            stopCamera();
            setIsLoginModalOpen(false);
            setModalStep('options');
            setCapturedImage(null);
        }
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
            // Fallback to warning if workMode is Work from Office
            if (loginOptions.workMode === 'Work from Office') {
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

                if (distance > 50) {
                    alert(`Access Denied: You are ${distance.toFixed(0)}m away. You must be within 50m of the office to check-in.`);
                    setIsSubmitting(false);
                    return;
                }
            }
        } else if (loginOptions.workMode === 'Work from Office' && !loginLocation.latitude) {
            // This case should be handled by the catch block above, but as a safety measure:
            setIsSubmitting(false);
            return;
        }

        setLastValidatedLocation({ lat: loginLocation.latitude, lng: loginLocation.longitude });

        // Instead of API call, move to Face Capture
        setModalStep('face-capture');
        setIsSubmitting(false);
        startCamera();
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Camera error:", err);
            alert("Could not access camera. Please ensure you have granted permission.");
            setModalStep('options');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const captureAndSubmit = async () => {
        if (!videoRef.current || !user) return;
        setIsSubmitting(true);

        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageData);
                
                // Stop camera before final submission
                stopCamera();

                // Now proceed with API call
                await finalCheckIn(imageData);
            }
        } catch (err) {
            console.error("Capture error:", err);
            alert("Failed to capture image. Please try again.");
            setIsSubmitting(false);
        }
    };

    const finalCheckIn = async (faceImage: string) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        let status = 'Present';
        if (loginOptions.shiftType === 'Day Shift') {
            const nineFifteen = new Date();
            nineFifteen.setHours(9, 15, 0, 0);
            
            if (now > nineFifteen) {
                status = 'Half Day';
            }
        } else {
            const eightFortyFivePM = new Date();
            eightFortyFivePM.setHours(20, 45, 0, 0);

            if (now > eightFortyFivePM) {
                status = 'Half Day';
            }
        }

        try {
            // Use the already validated location
            const lat = lastValidatedLocation?.lat;
            const lng = lastValidatedLocation?.lng;

            const tzOffset = now.getTimezoneOffset() * 60000;
            const today = new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
            
            const res = await api.post('/api/attendance', {
                employeeId: user.id,
                employeeName: user.name,
                date: today,
                status,
                checkIn: timeString,
                workMode: loginOptions.workMode,
                workLocation: loginOptions.workLocation,
                shiftType: loginOptions.shiftType,
                faceImage, // NEW: sending the captured image
                location: { lat, lng }
            });
            const data = await res.json();

            setIsCheckedIn(true);
            setClockedInTime(timeString);
            setClockedOutTime('--:--');
            setAttendanceId(data.id);
            setSessionLocation({ workMode: loginOptions.workMode, workLocation: loginOptions.workLocation, workHours: 0 });
            setIsLoginModalOpen(false);
            setModalStep('options');
        } catch (error: any) {
            console.error("Error checking in:", error);
            alert(error.message || "Failed to check in. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCheckOut = async () => {
        if (!attendanceId) return;

        const isConfirm = window.confirm("Are you sure you want to Check Out for today? You will not be able to log back in for this shift.");
        if (!isConfirm) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        try {
            let workHours = 0;
            if (clockedInTime !== '--:--') {
                const [inH, inM] = clockedInTime.split(':').map(Number);
                const outH = now.getHours();
                const outM = now.getMinutes();
                let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
                if (diffMins < 0) diffMins += 24 * 60;
                workHours = Number((diffMins / 60).toFixed(2));
            }

            await api.put(`/api/attendance/${attendanceId}`, {
                checkOut: timeString,
                workHours
            });

            setIsCheckedIn(false);
            setIsCheckedOut(true);
            setClockedOutTime(timeString);
            setSessionLocation(prev => ({ ...prev, workHours }));
        } catch (error) {
            console.error("Error checking out:", error);
        }
    };

    const handleBreakAction = async (type: 'Break' | 'Lunch') => {
        if (!attendanceId) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        try {
            let updatedBreaks = [...breakHistory];

            if (activeBreak) {
                // Ending ongoing break
                const breakIndex = updatedBreaks.findIndex(b => !b.endTime);
                if (breakIndex !== -1) {
                    const start = updatedBreaks[breakIndex].startTime;
                    const [sH, sM] = start.split(':').map(Number);
                    const [eH, eM] = timeString.split(':').map(Number);
                    
                    let diffMins = (eH * 60 + eM) - (sH * 60 + sM);
                    if (diffMins < 0) diffMins += 24 * 60;

                    updatedBreaks[breakIndex] = {
                        ...updatedBreaks[breakIndex],
                        endTime: timeString,
                        duration: diffMins
                    };
                }
                setActiveBreak(null);
            } else {
                // Starting new break
                updatedBreaks.push({
                    type,
                    startTime: timeString
                });
                setActiveBreak({ type, startTime: timeString });
            }

            await api.put(`/api/attendance/${attendanceId}`, {
                breaks: updatedBreaks
            });
            setBreakHistory(updatedBreaks);

        } catch (error) {
            console.error("Error updating break:", error);
            alert("Failed to update break session.");
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
        { icon: HelpCircle, label: 'Queries', path: '/employee-dashboard/queries' },
        { icon: Book, label: 'Company Policies', path: '/employee-dashboard/policies' },
    ];



    if (!user) {
        return (
            <div style={{ height: '100vh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '24px' }}>[RESCUE] Loading Dashboard...</h1>
                <p>If this screen persists, no user data was found in localStorage.</p>
                <button onClick={() => navigate('/login')} style={{ marginTop: '20px', padding: '10px 20px', background: 'blue' }}>Go to Login</button>
            </div>
        );
    }

    console.log("[EMPLOYEE DASHBOARD] Rendering dashboard for user:", user.name);

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
                                <p className="text-sm font-semibold text-brand-text truncate max-w-[120px]">{user?.name || 'Employee'}</p>
                                <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest truncate max-w-[120px] -mt-0.5">{user?.id || 'ID'}</p>
                                <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest truncate max-w-[120px] mt-0.5">{user?.role || 'employee'}</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
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
                        <header className="sticky top-0 z-30 flex flex-col items-stretch p-4 md:p-6 border-b border-brand-border bg-brand-bg/80 backdrop-blur-xl gap-4 md:flex-row md:items-center md:justify-end">
                            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6 w-full justify-end">
                                    {/* Session Info Card */}
                                    <div className="flex items-center gap-6 px-6 py-3 bg-brand-surface border border-brand-border rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col min-w-[70px]">
                                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] mb-1">Clock In</span>
                                                <span className="text-sm font-black text-brand-text">{clockedInTime !== '--:--' ? formatTimeTo12Hour(clockedInTime) : '--:--'}</span>
                                            </div>
                                            <div className="h-8 w-px bg-brand-border" />
                                            <div className="flex flex-col min-w-[70px]">
                                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] mb-1">Status</span>
                                                {sessionLocation.workMode ? (
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border w-fit",
                                                        sessionLocation.workMode === 'Work from Office'
                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                            : "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                                                    )}>
                                                        {sessionLocation.workMode === 'Work from Office' ? 'Office' : 'Remote'}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">—</span>
                                                )}
                                            </div>
                                            <div className="h-8 w-px bg-brand-border" />
                                            <div className="flex flex-col min-w-[80px]">
                                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] mb-1">Worked</span>
                                                <span className="text-sm font-black text-brand-primary">
                                                    {calculateWorkingHours(clockedInTime, clockedOutTime, sessionLocation.workHours)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls Group */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Main Actions */}
                                        <div className="flex bg-brand-surface border border-brand-border rounded-2xl p-1 shadow-sm">
                                            <button
                                                onClick={() => {
                                                    if (!isCheckedIn && !isCheckedOut) {
                                                        handleCheckIn();
                                                    }
                                                }}
                                                disabled={isCheckedIn || isCheckedOut}
                                                className={cn(
                                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                                                    (isCheckedIn || isCheckedOut)
                                                        ? "bg-brand-bg text-brand-muted opacity-50 cursor-not-allowed"
                                                        : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95"
                                                )}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                {isCheckedOut ? "Shift End" : isCheckedIn ? "At Work" : "Check In"}
                                            </button>
                                            <button
                                                onClick={handleCheckOut}
                                                disabled={!isCheckedIn || isCheckedOut}
                                                className={cn(
                                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                                                    !isCheckedIn || isCheckedOut
                                                        ? "text-brand-muted opacity-30 cursor-not-allowed"
                                                        : "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95"
                                                )}
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {isCheckedOut ? "Finished" : "Check Out"}
                                            </button>
                                        </div>

                                        {/* Break Actions */}
                                        {isCheckedIn && !isCheckedOut && (
                                            <div className="flex bg-brand-surface border border-brand-border rounded-2xl p-1 shadow-sm animate-in slide-in-from-right-4 duration-500">
                                                <button
                                                    onClick={() => handleBreakAction('Break')}
                                                    disabled={!!activeBreak && activeBreak.type !== 'Break'}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                        activeBreak?.type === 'Break'
                                                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                                                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg",
                                                        activeBreak && activeBreak.type !== 'Break' ? "opacity-30 cursor-not-allowed" : ""
                                                    )}
                                                >
                                                    <Clock className={cn("w-3.5 h-3.5", activeBreak?.type === 'Break' ? "animate-pulse" : "")} />
                                                    {activeBreak?.type === 'Break' ? "End" : "Break"}
                                                </button>
                                                <button
                                                    onClick={() => handleBreakAction('Lunch')}
                                                    disabled={!!activeBreak && activeBreak.type !== 'Lunch'}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                        activeBreak?.type === 'Lunch'
                                                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg",
                                                        activeBreak && activeBreak.type !== 'Lunch' ? "opacity-30 cursor-not-allowed" : ""
                                                    )}
                                                >
                                                    <Sun className={cn("w-3.5 h-3.5", activeBreak?.type === 'Lunch' ? "animate-pulse" : "")} />
                                                    {activeBreak?.type === 'Lunch' ? "End" : "Lunch"}
                                                </button>
                                            </div>
                                        )}
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
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-5 md:p-6 border-b border-brand-border bg-gradient-to-br from-brand-primary/10 to-transparent shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-brand-primary rounded-xl shadow-lg shadow-brand-primary/20">
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-brand-text tracking-tighter">Attendance Check-in</h3>
                                            <p className="text-brand-muted text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-60">Session Authorization</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-brand-bg rounded-xl transition-colors text-brand-muted hover:text-brand-text"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 md:p-6 space-y-5 md:space-y-6 overflow-y-auto no-scrollbar">
                                {modalStep === 'options' ? (
                                    <>
                                        {/* Work Mode Selection */}
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] md:text-[11px] font-black text-brand-muted uppercase tracking-[0.2em] ml-1">Working Environment</label>
                                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                                {[
                                                    { id: 'Work from Office', icon: Building2, label: 'Office' },
                                                    { id: 'Work from Home', icon: Home, label: 'Remote' }
                                                ].map((mode) => (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => setLoginOptions(prev => ({ ...prev, workMode: mode.id }))}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border-2 transition-all group",
                                                            loginOptions.workMode === mode.id
                                                                ? "bg-brand-primary-light border-brand-primary shadow-lg shadow-brand-primary/10"
                                                                : "bg-brand-bg border-brand-border hover:border-brand-primary/50"
                                                        )}
                                                    >
                                                        <mode.icon className={cn(
                                                            "w-5 h-5 md:w-6 md:h-6",
                                                            loginOptions.workMode === mode.id ? "text-brand-primary" : "text-brand-muted group-hover:text-brand-primary"
                                                        )} />
                                                        <span className={cn(
                                                            "text-xs md:text-sm font-black uppercase tracking-widest",
                                                            loginOptions.workMode === mode.id ? "text-brand-primary" : "text-brand-muted"
                                                        )}>{mode.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Location Selection */}
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] md:text-[11px] font-black text-brand-muted uppercase tracking-[0.2em] ml-1">Assigned Branch</label>
                                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                                {['Chennai', 'Bangalore'].map((loc) => (
                                                    <button
                                                        key={loc}
                                                        onClick={() => setLoginOptions(prev => ({ ...prev, workLocation: loc }))}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center gap-2 py-3 md:py-4 rounded-xl border-2 transition-all font-bold",
                                                            loginOptions.workLocation === loc
                                                                ? "bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20"
                                                                : "bg-brand-bg border-brand-border text-brand-muted hover:border-brand-primary/50"
                                                        )}
                                                    >
                                                        <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                                                        <span className="text-xs md:text-sm">{loc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Shift Selection */}
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] md:text-[11px] font-black text-brand-muted uppercase tracking-[0.2em] ml-1">Shift Type</label>
                                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                                {[
                                                    { id: 'Day Shift', icon: Sun, label: 'Day Shift', time: '9AM - 6:30PM' },
                                                    { id: 'Night Shift', icon: Moon, label: 'Night Shift', time: '8:30PM - 5:30AM' }
                                                ].map((shift) => (
                                                    <button
                                                        key={shift.id}
                                                        onClick={() => setLoginOptions(prev => ({ ...prev, shiftType: shift.id }))}
                                                        className={cn(
                                                            "flex flex-col items-center gap-1.5 py-3 md:py-4 px-2 rounded-xl border-2 transition-all font-bold",
                                                            loginOptions.shiftType === shift.id
                                                                ? "bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20"
                                                                : "bg-brand-bg border-brand-border text-brand-muted hover:border-brand-primary/50"
                                                        )}
                                                    >
                                                        <shift.icon className="w-4 h-4 md:w-5 md:h-5" />
                                                        <div className="flex flex-col gap-0.5 items-center">
                                                            <span className="text-xs md:text-sm">{shift.label}</span>
                                                            <span className={cn(
                                                                "text-[9px] font-black tracking-wider uppercase opacity-80",
                                                            )}>{shift.time}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-brand-primary/20">
                                            {!capturedImage ? (
                                                <>
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        className="w-full h-full object-cover mirror"
                                                        style={{ transform: 'scaleX(-1)' }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="w-48 h-48 md:w-64 md:h-64 border-2 border-white/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                                                        <div className="absolute w-44 h-44 md:w-60 md:h-60 border-2 border-brand-primary/50 rounded-full" />
                                                    </div>
                                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                                        <div className="px-4 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Camera</span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        
                                        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-4 flex gap-4 items-center">
                                            <div className="p-2 bg-brand-primary/10 rounded-xl">
                                                <Camera className="w-5 h-5 text-brand-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-brand-text">Face Recognition Required</p>
                                                <p className="text-[10px] text-brand-muted">Please look into the camera for session authorization.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 md:p-6 bg-brand-bg/50 border-t border-brand-border flex gap-4 shrink-0">
                                {modalStep === 'options' ? (
                                    <>
                                        <button
                                            onClick={closeModal}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 px-6 rounded-xl border border-brand-border font-black text-[10px] uppercase tracking-widest text-brand-muted hover:bg-brand-surface transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmCheckIn}
                                            disabled={isSubmitting}
                                            className="flex-[2] py-3 px-6 bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
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
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                stopCamera();
                                                setModalStep('options');
                                            }}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 px-6 rounded-xl border border-brand-border font-black text-[10px] uppercase tracking-widest text-brand-muted hover:bg-brand-surface transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Back
                                        </button>
                                        <button
                                            onClick={captureAndSubmit}
                                            disabled={isSubmitting}
                                            className="flex-[2] py-3 px-6 bg-status-approved text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Capturing...
                                                </>
                                            ) : (
                                                <>
                                                    Capture & Check-in
                                                    <UserCheck className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmployeeDashboard;
