import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    ShieldCheck,
    TrendingUp,
    DollarSign,
    Calendar,
    Building2,
    Settings,
    File,
    Menu,
    X,
    Briefcase,
    CreditCard,
    Clock,
    CheckCircle2,
    Camera,
    RefreshCw,
    UserCheck,
    Sun,
    Moon,
    ChevronRight,
    Loader2,
    Home,
    MapPin
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/forge india logo.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const BRANCH_LOCATIONS = {
    'Bangalore': { lat: 12.971748775481734, lng: 77.50804575326372 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Palacode': { lat: 12.299359170545028, lng: 78.0733771109474 }
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
    if (time.toUpperCase().includes('AM') || time.toUpperCase().includes('PM')) {
        return time;
    }
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
        const parseTime = (t: string) => {
            const isPM = t.toUpperCase().includes('PM');
            const [timePart] = t.split(' ');
            let [h, m] = timePart.split(':').map(Number);
            if (isPM && h !== 12) h += 12;
            if (!isPM && h === 12 && t.toUpperCase().includes('AM')) h = 0;
            return { h, m };
        };
        const { h: inH, m: inM } = parseTime(formatTimeTo12Hour(checkIn));
        const { h: outH, m: outM } = parseTime(formatTimeTo12Hour(checkOut));
        
        let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
        if (diffMins < 0) diffMins += 24 * 60;
        
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        return `${hrs}h ${mins}m`;
    } catch {
        return dbWorkHours ? `${dbWorkHours.toFixed(1)} hrs` : '--:--';
    }
};

const SubAdminDashboard: React.FC = () => {
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) {
            navigate('/login');
        }
    }, [navigate, user]);

    useEffect(() => {
        const handleUserUpdate = () => {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {
                    console.error("Error parsing user on update", e);
                }
            }
        };
        window.addEventListener('user-update', handleUserUpdate);
        return () => window.removeEventListener('user-update', handleUserUpdate);
    }, []);

    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckedOut, setIsCheckedOut] = useState(false);
    const [clockedInTime, setClockedInTime] = useState('--:--');
    const [clockedOutTime, setClockedOutTime] = useState('--:--');
    const [attendanceId, setAttendanceId] = useState<string | null>(null);
    const [sessionLocation, setSessionLocation] = useState({ workMode: '', workLocation: '', workHours: 0 });
    const [activeBreak, setActiveBreak] = useState<{ type: 'Break' | 'Lunch', startTime: string } | null>(null);
    const [breakHistory, setBreakHistory] = useState<any[]>([]);

    // Login Options Modal State
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [loginOptions, setLoginOptions] = useState({
        workMode: 'Work from Office',
        workLocation: '',
        shiftType: 'Day Shift'
    });

    // Face Capture State
    const [modalStep, setModalStep] = useState<'options' | 'face-capture'>('options');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [lastValidatedLocation, setLastValidatedLocation] = useState<{ lat?: number; lng?: number } | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [showProfile, setShowProfile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const branchName = user?.branchName || 'Branch';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch branches dynamically from API
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const token = localStorage.getItem('token') || '';
                const res = await fetch(`${(await import('../config')).API_URL}/api/branches`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setBranches(data);
                    const names = data.map((b: any) => b.name).filter(Boolean);
                    const userBranch = user?.branchName;
                    const defaultBranch = names.includes(userBranch) ? userBranch : (names[0] || '');
                    setLoginOptions(prev => ({ ...prev, workLocation: defaultBranch }));
                }
            } catch (err) {
                console.error('Failed to fetch branches:', err);
            }
        };
        if (user) {
            fetchBranches();
        }
    }, [user]);

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
                console.warn("[SUBADMIN DASHBOARD] Attendance API did not return an array.");
                return;
            }

            const record = data.length > 0 ? data[0] : null;

            if (record) {
                const isOvernightShift = record.date === yesterday && record.shiftType === 'Night Shift' && !record.checkOut;
                
                if (record.date === today || isOvernightShift) {
                    setAttendanceId(record._id || record.id);
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
        if (user) {
            fetchTodayAttendance(user.id);
        }
    }, [user]);

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
                stopCamera();
                await finalCheckIn(imageData);
            }
        } catch (err) {
            console.error("Capture error:", err);
            alert("Failed to capture image. Please try again.");
            setIsSubmitting(false);
        }
    };

    const confirmCheckIn = async () => {
        if (!user) return;
        setIsSubmitting(true);

        let loginLocation: { latitude?: number; longitude?: number } = { latitude: undefined, longitude: undefined };

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000
                });
            });
            loginLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
        } catch (err: any) {
            if (loginOptions.workMode === 'Work from Office') {
                let errorMessage = "Location Error: We could not verify your position.";
                if (err.code === 1) {
                    errorMessage = "Location Denied: Please enable GPS and allow location access in your browser settings to check-in from the office.";
                } else if (err.code === 3) {
                    errorMessage = "Location Timeout: GPS signal is weak. Please try again or move to an area with better reception.";
                } else {
                    errorMessage = "Location Error: Office login requires GPS access. Please ensure your location is enabled.";
                }
                alert(errorMessage);
                setIsSubmitting(false);
                return;
            }
        }

        if (loginOptions.workMode === 'Work from Office') {
            if (!loginLocation.latitude || !loginLocation.longitude) {
                alert("Kindly check the location. Please enable GPS access to check-in.");
                setIsSubmitting(false);
                return;
            }

            let selectedBranch = branches.find((b: any) => b.name === loginOptions.workLocation);
            
            if (!selectedBranch || !selectedBranch.latitude || !selectedBranch.longitude) {
                const fallbackBranch = BRANCH_LOCATIONS[loginOptions.workLocation as keyof typeof BRANCH_LOCATIONS];
                if (!fallbackBranch) {
                    alert("Kindly check the location. Your branch coordinates are not configured in the system.");
                    setIsSubmitting(false);
                    return;
                }
                selectedBranch = { latitude: fallbackBranch.lat, longitude: fallbackBranch.lng };
            }

            const distance = calculateDistance(
                loginLocation.latitude,
                loginLocation.longitude,
                selectedBranch.latitude,
                selectedBranch.longitude
            );

            console.log(`[GEOFENCE] Distance to ${loginOptions.workLocation} branch: ${distance.toFixed(2)}m`);

            if (distance > 50) {
                alert(`Access Denied: You are ${distance.toFixed(0)}m away. Kindly check the location. You must be within 50m of the office to check-in.`);
                setIsSubmitting(false);
                return;
            }
        }

        setLastValidatedLocation({ lat: loginLocation.latitude, lng: loginLocation.longitude });
        setModalStep('face-capture');
        setIsSubmitting(false);
        startCamera();
    };

    const finalCheckIn = async (faceImage: string) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const tzOffset = now.getTimezoneOffset() * 60000;
        const today = new Date(now.getTime() - tzOffset).toISOString().split('T')[0];

        let status = 'Present';

        try {
            const lat = lastValidatedLocation?.lat;
            const lng = lastValidatedLocation?.lng;

            const res = await api.post('/api/attendance', {
                employeeId: user.id,
                employeeName: user.name,
                date: today,
                status,
                checkIn: timeString,
                workMode: loginOptions.workMode,
                workLocation: loginOptions.workLocation,
                shiftType: loginOptions.shiftType,
                faceImage,
                location: { lat, lng }
            });
            const data = await res.json();

            setIsCheckedIn(true);
            setClockedInTime(timeString);
            setClockedOutTime('--:--');
            setAttendanceId(data._id || data.id);
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
                const parseTime = (t: string) => {
                    const isPM = t.toUpperCase().includes('PM');
                    const [timePart] = t.split(' ');
                    let [h, m] = timePart.split(':').map(Number);
                    if (isPM && h !== 12) h += 12;
                    if (!isPM && h === 12 && t.toUpperCase().includes('AM')) h = 0;
                    return { h, m };
                };
                const { h: inH, m: inM } = parseTime(formatTimeTo12Hour(clockedInTime));
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
                const breakIndex = updatedBreaks.findIndex(b => !b.endTime);
                if (breakIndex !== -1) {
                    const start = updatedBreaks[breakIndex].startTime;
                    const parseTime = (t: string) => {
                        const isPM = t.toUpperCase().includes('PM');
                        const [timePart] = t.split(' ');
                        let [h, m] = timePart.split(':').map(Number);
                        if (isPM && h !== 12) h += 12;
                        if (!isPM && h === 12 && t.toUpperCase().includes('AM')) h = 0;
                        return { h, m };
                    };
                    const { h: sH, m: sM } = parseTime(formatTimeTo12Hour(start));
                    const { h: eH, m: eM } = parseTime(formatTimeTo12Hour(timeString));
                    
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
        { icon: LayoutDashboard, label: 'Overview', path: '/subadmin-dashboard' },
        { icon: Building2, label: 'HR', path: '/subadmin-dashboard/hr' },
        { icon: Users, label: 'Employees', path: '/subadmin-dashboard/employees' },
        { icon: Calendar, label: 'Attendance', path: '/subadmin-dashboard/attendance' },
        { icon: DollarSign, label: 'Salary', path: '/subadmin-dashboard/payroll' },
        { icon: FileText, label: 'Leaves', path: '/subadmin-dashboard/leaves' },
        { icon: FileText, label: 'Permissions', path: '/subadmin-dashboard/permissions' },
        { icon: CreditCard, label: 'Expenses', path: '/subadmin-dashboard/expenses' },
        { icon: TrendingUp, label: 'Performance', path: '/subadmin-dashboard/performance' },
        { icon: File, label: 'Documents', path: '/subadmin-dashboard/documents' },
        { icon: Briefcase, label: 'Jobs', path: '/subadmin-dashboard/jobs' },
        { icon: LogOut, label: 'Resignation', path: '/subadmin-dashboard/resignation' },
        { icon: Settings, label: 'Settings', path: '/subadmin-dashboard/settings' },
    ];

    return (
        <div className="h-dvh bg-brand-bg text-brand-text flex overflow-hidden font-sans relative">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 border-r border-brand-border bg-brand-surface flex flex-col p-6 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-dvh lg:flex",
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
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-brand-text tracking-tight leading-tight">Forge India Connect</span>
                            <span className="text-xs font-black text-brand-primary uppercase tracking-widest mt-0.5">{branchName}</span>
                        </div>
                    </div>
                    <button
                        className="lg:hidden p-2 hover:bg-brand-bg rounded-lg transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6 text-brand-muted" />
                    </button>
                </div>

                <nav className="flex-1 space-y-3 overflow-y-auto pr-2 no-scrollbar mt-2">
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

                <div className="mt-4 pt-4 border-t border-brand-border">
                    <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-brand-bg border border-brand-border group">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => {
                                setShowProfile(true);
                                setIsSidebarOpen(false);
                            }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-blue-400 p-[2px]">
                                <div className="w-full h-full rounded-[10px] bg-brand-surface flex items-center justify-center overflow-hidden">
                                    <ShieldCheck className="w-5 h-5 text-brand-primary" />
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-brand-text group-hover:text-brand-primary transition-colors">{user?.name || 'Sub Admin'}</p>
                                <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest opacity-60 scale-90 -ml-1 mt-0.5">{branchName}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                navigate('/login');
                            }}
                            className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-550 rounded-xl transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Top Nav */}
                <header className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4 border-b border-brand-border bg-brand-surface sticky top-0 z-30">
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
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-brand-text tracking-tight leading-tight">Forge India Connect</span>
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{branchName}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-brand-bg rounded-lg transition-colors ring-1 ring-brand-border shadow-sm bg-brand-surface"
                    >
                        <Menu className="w-6 h-6 text-brand-primary" />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto relative bg-brand-bg no-scrollbar">
                    {/* Header with clock-in */}
                    {(location.pathname === '/subadmin-dashboard' || location.pathname === '/subadmin-dashboard/') && (
                        <header className="sticky top-0 z-30 p-3 md:p-5 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
                            <div className="flex flex-col gap-3">
                                {/* Session info pills row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-[10px] font-black text-brand-muted">
                                        <Clock className="w-3 h-3 text-brand-primary" />
                                        <span className="text-brand-text tabular-nums">
                                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-[10px] font-black text-brand-muted">
                                        <span>IN: <span className="text-brand-text">{clockedInTime !== '--:--' ? formatTimeTo12Hour(clockedInTime) : '--:--'}</span></span>
                                    </div>
                                    {sessionLocation.workMode && (
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border",
                                            sessionLocation.workMode === 'Work from Office'
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                : "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                                        )}>
                                            {sessionLocation.workMode === 'Work from Office' ? '🏢 Office' : '🏠 Remote'}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-[10px] font-black text-brand-primary">
                                        ⏱ {calculateWorkingHours(clockedInTime, clockedOutTime, sessionLocation.workHours)}
                                    </div>
                                </div>

                                {/* Action buttons row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex bg-brand-surface border border-brand-border rounded-xl p-1 shadow-sm flex-1 min-w-0">
                                        <button
                                            onClick={() => { if (!isCheckedIn && !isCheckedOut) handleCheckIn(); }}
                                            disabled={isCheckedIn || isCheckedOut}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                (isCheckedIn || isCheckedOut)
                                                    ? "bg-brand-bg text-brand-muted opacity-50 cursor-not-allowed"
                                                    : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95"
                                            )}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {isCheckedOut ? "Done" : isCheckedIn ? "Working" : "Check In"}
                                        </button>
                                        <button
                                            onClick={handleCheckOut}
                                            disabled={!isCheckedIn || isCheckedOut}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                !isCheckedIn || isCheckedOut
                                                    ? "text-brand-muted opacity-30 cursor-not-allowed"
                                                    : "bg-rose-500 text-white shadow-lg shadow-rose-500/20 active:scale-95"
                                            )}
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            {isCheckedOut ? "Done" : "Check Out"}
                                        </button>
                                    </div>

                                    {isCheckedIn && !isCheckedOut && (
                                        <div className="flex bg-brand-surface border border-brand-border rounded-xl p-1 shadow-sm">
                                            <button
                                                onClick={() => handleBreakAction('Break')}
                                                disabled={!!activeBreak && activeBreak.type !== 'Break'}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                    activeBreak?.type === 'Break'
                                                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                                                        : "text-brand-muted hover:text-brand-text hover:bg-brand-bg",
                                                    activeBreak && activeBreak.type !== 'Break' ? "opacity-30 cursor-not-allowed" : ""
                                                )}
                                            >
                                                <Clock className={cn("w-3 h-3", activeBreak?.type === 'Break' ? "animate-pulse" : "")} />
                                                {activeBreak?.type === 'Break' ? "End" : "Break"}
                                            </button>
                                            <button
                                                onClick={() => handleBreakAction('Lunch')}
                                                disabled={!!activeBreak && activeBreak.type !== 'Lunch'}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                    activeBreak?.type === 'Lunch'
                                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                        : "text-brand-muted hover:text-brand-text hover:bg-brand-bg",
                                                    activeBreak && activeBreak.type !== 'Lunch' ? "opacity-30 cursor-not-allowed" : ""
                                                )}
                                            >
                                                <Sun className={cn("w-3 h-3", activeBreak?.type === 'Lunch' ? "animate-pulse" : "")} />
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

            {/* Profile Modal */}
            {showProfile && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button
                            onClick={() => setShowProfile(false)}
                            className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-bg rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col items-center mt-4">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-primary to-blue-500 p-[3px] mb-4">
                                <div className="w-full h-full rounded-[14px] bg-brand-surface flex items-center justify-center">
                                    <ShieldCheck className="w-10 h-10 text-brand-primary" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-brand-text tracking-tight">{user?.name || 'Sub Admin'}</h3>
                            <p className="text-sm font-bold text-brand-primary mt-1">{branchName}</p>
                            <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mt-2 px-3 py-1 bg-brand-bg rounded-full border border-brand-border">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                                                {branches.length === 0 ? (
                                                    <div className="col-span-2 text-center text-xs text-brand-muted py-3 animate-pulse">Loading branches...</div>
                                                ) : (
                                                    branches.map((loc: any) => (
                                                        <button
                                                            key={loc.name}
                                                            onClick={() => setLoginOptions(prev => ({ ...prev, workLocation: loc.name }))}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center gap-2 py-3 md:py-4 rounded-xl border-2 transition-all font-bold",
                                                                loginOptions.workLocation === loc.name
                                                                    ? "bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20"
                                                                    : "bg-brand-bg border-brand-border text-brand-muted hover:border-brand-primary/50"
                                                            )}
                                                        >
                                                            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                                                            <span className="text-xs md:text-sm">{loc.name}</span>
                                                        </button>
                                                    ))
                                                )}
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
                                                        className="w-full h-full object-cover"
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
                                            className="flex-[2] py-3 px-6 bg-status-approved text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 animate-pulse"
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

export default SubAdminDashboard;
