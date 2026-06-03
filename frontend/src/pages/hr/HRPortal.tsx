import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Calendar, FileText, Bell,
    LogOut, X, DollarSign, Shield,
    Search, Plus, XCircle, CheckCircle,
    Mail, Phone, Edit2, Trash2, UserPlus, ClipboardList,
    Building2, Home, MapPin, Loader2, ChevronRight, Clock, CreditCard,
    Settings, User, Lock, Eye, EyeOff, Menu,
    Camera, RefreshCw, UserCheck, Sun, Moon
} from 'lucide-react';
import api from '../../api';
import logo from '../../assets/forge india logo.jpg';
import AdminPayroll from '../admin/Payroll';
import EmployeeExpenses from '../employee/EmployeeExpenses';
import EmployeeAttendance from '../employee/EmployeeAttendance';
import EmployeeTasks from '../employee/EmployeeTasks';
import JobsTab from '../../components/JobsTab';
import ResignationTab from '../../components/ResignationTab';
import Permissions from '../admin/Permissions';

// ─── helpers ─────────────────────────────────────────────────────────────────
const BRANCH_LOCATIONS = {
    'Bangalore': { lat: 12.971748775481734, lng: 77.50804575326372 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Palacode': { lat: 12.299359170545028, lng: 78.0733771109474 }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const cn = (...classes: (string | boolean | undefined)[]) =>
    classes.filter(Boolean).join(' ');

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
    } catch {
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
        const { h: inH, m: inM } = parseTime(checkIn);
        const { h: outH, m: outM } = parseTime(checkOut);
        
        let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
        if (diffMins < 0) diffMins += 24 * 60;
        
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        return `${hrs}h ${mins}m`;
    } catch {
        return dbWorkHours ? `${dbWorkHours.toFixed(1)} hrs` : '--:--';
    }
};

const Badge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        Approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Rejected: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Inactive: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    };
    return (
        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border', map[status] || 'bg-brand-surface border-brand-border text-brand-muted')}>
            {status}
        </span>
    );
};

// ─── Sidebar items ────────────────────────────────────────────────────────────
const NAV = [
    { id: 'overview',     icon: LayoutDashboard, label: 'Overview' },
    { id: 'task-assignment', icon: ClipboardList,   label: 'Assign Task' },
    { id: 'employees',    icon: Users,            label: 'Employees' },
    { id: 'attendance',   icon: Calendar,         label: 'Attendance' },
    { id: 'leaves',       icon: FileText,         label: 'Leave Requests' },
    { id: 'payroll',      icon: DollarSign,       label: 'Payroll' },
    { id: 'permissions',  icon: Shield,           label: 'Permissions' },
    { id: 'expenses',     icon: CreditCard,       label: 'Expenses' },
    { id: 'announcements',icon: Bell,             label: 'Announcements' },
    { id: 'jobs',         icon: ClipboardList,    label: 'Jobs' }, // Actually better to use Briefcase, I'll assume lucide icon is loaded or I'll just use Briefcase 
    { id: 'resignation',  icon: LogOut,           label: 'Resignation' },
    { id: 'settings',     icon: Settings,         label: 'Settings' },
];

// ─── Section: Overview ────────────────────────────────────────────────────────
const Overview = ({ employees, leaves, attendance, onRefresh }: any) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const todayStr = new Date().toISOString().split('T')[0];
    const myRecord = attendance.find((a: any) => a.employeeId === user.id && a.date === todayStr);

    const isCheckedIn = !!myRecord;
    const isCheckedOut = !!(myRecord && myRecord.checkOut);

    const clockedInTime = myRecord?.checkIn || '--:--';
    const clockedOutTime = myRecord?.checkOut || '--:--';
    const sessionLocation = { 
        workMode: myRecord?.workMode || '', 
        workLocation: myRecord?.workLocation || '', 
        workHours: myRecord?.workHours || 0 
    };

    // Modal State
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [loginOptions, setLoginOptions] = useState({
        workMode: 'Work from Office',
        workLocation: '',
        shiftType: 'Day Shift'
    });

    const [modalStep, setModalStep] = useState<'options' | 'face-capture'>('options');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [lastValidatedLocation, setLastValidatedLocation] = useState<{ lat?: number; lng?: number } | null>(null);
    
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch branches dynamically from API
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const token = localStorage.getItem('token') || '';
                const res = await fetch(`${(await import('../../config')).API_URL}/api/branches`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setBranches(data);
                    const names = data.map((b: any) => b.name).filter(Boolean);
                    // Auto-select the user's branch or first available
                    const userBranch = user?.branchName;
                    const defaultBranch = names.includes(userBranch) ? userBranch : (names[0] || '');
                    setLoginOptions(prev => ({ ...prev, workLocation: defaultBranch }));
                }
            } catch (err) {
                console.error('Failed to fetch branches:', err);
            }
        };
        fetchBranches();
    }, []);

    const markAttendance = async () => {
        if (!myRecord) {
            setModalStep('options');
            setCapturedImage(null);
            setIsLoginModalOpen(true);
        } else if (!myRecord.checkOut) {
            handleCheckOut();
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

    const closeModal = () => {
        if (!isSubmitting) {
            stopCamera();
            setIsLoginModalOpen(false);
            setModalStep('options');
            setCapturedImage(null);
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
                selectedBranch.latitude || (selectedBranch as any).lat,
                selectedBranch.longitude || (selectedBranch as any).lng
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

        let status = 'Present';
        if (loginOptions.shiftType === 'Day Shift') {
            const nineFortyFive = new Date();
            nineFortyFive.setHours(9, 45, 0, 0);
            
            if (now > nineFortyFive) {
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
            const lat = lastValidatedLocation?.lat;
            const lng = lastValidatedLocation?.lng;

            await api.post('/api/attendance', {
                employeeId: user.id,
                employeeName: user.name,
                date: todayStr,
                checkIn: timeString,
                status,
                workMode: loginOptions.workMode,
                workLocation: loginOptions.workLocation,
                shiftType: loginOptions.shiftType,
                faceImage,
                location: { lat, lng }
            });
            setIsLoginModalOpen(false);
            onRefresh();
        } catch (err: any) {
            console.error("Error checking in:", err);
            alert(err.message || "Failed to check in. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCheckOut = async () => {
        if (!myRecord) return;
        const isConfirm = window.confirm("Are you sure you want to Check Out for today? You will not be able to log back in for this shift.");
        if (!isConfirm) return;

        try {
            const checkOutStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            let workHours = 0;
            if (myRecord.checkIn) {
                try {
                    const inTime = formatTimeTo12Hour(myRecord.checkIn);
                    const outTime = formatTimeTo12Hour(checkOutStr);
                    const parseTime = (t: string) => {
                        const isPM = t.toUpperCase().includes('PM');
                        const [timePart] = t.split(' ');
                        let [h, m] = timePart.split(':').map(Number);
                        if (isPM && h !== 12) h += 12;
                        if (!isPM && h === 12 && t.toUpperCase().includes('AM')) h = 0;
                        return { h, m };
                    };
                    const { h: inH, m: inM } = parseTime(inTime);
                    const { h: outH, m: outM } = parseTime(outTime);
                    let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
                    if (diffMins < 0) diffMins += 24 * 60;
                    workHours = Number((diffMins / 60).toFixed(2));
                } catch { /* ignore */ }
            }

            await api.put(`/api/attendance/${myRecord._id || myRecord.id}`, {
                ...myRecord,
                checkOut: checkOutStr,
                workHours
            });
            onRefresh();
        } catch (err: any) { alert(err.message); }
    };

    const totalEmp = employees.length;
    const todayAtt = attendance.filter((a: any) => a.date === todayStr).length;
    const pendingLeaves = leaves.filter((l: any) => l.status === 'Pending').length;

    const cards = [
        { label: 'Total Employees', value: totalEmp, icon: Users, color: 'bg-brand-primary' },
        { label: 'Today Attendance', value: todayAtt, icon: Calendar, color: 'bg-emerald-500' },
        { label: 'Pending Leaves', value: pendingLeaves, icon: FileText, color: 'bg-amber-500' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-brand-text tracking-tight">HR Dashboard Overview</h2>
                <p className="text-brand-muted text-sm font-medium">Real-time snapshot of your workforce today.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {cards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-brand-surface border border-brand-border rounded-[2rem] p-6 hover:border-brand-primary/30 transition-all flex items-center justify-between group shadow-sm">
                        <div className="space-y-1">
                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg', color)}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-4xl font-black text-brand-text tracking-tighter">{value}</p>
                            <p className="text-[11px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Attendance Card */}
            <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group border-b-4 border-b-brand-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                
                <div className="flex flex-col xl:flex-row items-center gap-12 relative z-10">
                    {/* Live Clock Section */}
                    <div className="flex items-center gap-6 min-w-[320px] pr-12 border-brand-border border-b xl:border-b-0 xl:border-r pb-8 xl:pb-0">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0 bg-brand-primary/5 animate-pulse" />
                            <Clock className="w-8 h-8 text-brand-primary relative z-10" />
                        </div>
                        <div>
                            <p className="text-5xl font-black text-brand-text tracking-tighter tabular-nums">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </p>
                            <div className="flex flex-col mt-1">
                                <p className="text-[11px] font-black text-brand-primary uppercase tracking-[0.4em] opacity-80">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                                </p>
                                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.1em] mt-0.5">
                                    {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Operational Details Section */}
                    <div className="flex-1 flex flex-row flex-wrap items-center justify-center xl:justify-start gap-4">
                        {/* Check-in Box */}
                        <div className="flex flex-col items-center">
                            <div className="bg-brand-bg border border-brand-border px-4 py-2 rounded-2xl min-w-[110px] flex flex-col items-center justify-center gap-1 shadow-inner group/box transition-all hover:bg-brand-surface">
                                <span className="text-base font-bold text-brand-text tabular-nums">{clockedInTime !== '--:--' ? formatTimeTo12Hour(clockedInTime) : '--:--'}</span>
                                {sessionLocation.workMode && (
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md shadow-sm border",
                                        sessionLocation.workMode === 'Work from Office'
                                            ? "bg-brand-primary text-white border-brand-primary/20"
                                            : "bg-indigo-600 text-white border-indigo-500/20" 
                                    )}>
                                        {sessionLocation.workMode === 'Work from Office' ? 'OFFICE' : 'REMOTE'}
                                    </span>
                                )}
                                {!sessionLocation.workMode && (
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 text-brand-muted">CLOCK IN</span>
                                )}
                            </div>
                        </div>

                        {/* Check-out & Location Box */}
                        <div className="flex flex-col items-center">
                            <div className="bg-brand-bg border border-brand-border px-4 py-2 rounded-2xl min-w-[110px] flex flex-col items-center justify-center gap-1 shadow-inner transition-all hover:bg-brand-surface">
                                <span className="text-base font-bold text-brand-text tabular-nums">{clockedOutTime !== '--:--' ? formatTimeTo12Hour(clockedOutTime) : '--:--'}</span>
                                <span className="text-[8px] text-brand-muted font-black uppercase tracking-[0.2em] opacity-60">
                                    {sessionLocation.workLocation || (isCheckedIn && !isCheckedOut ? 'ACTIVE' : 'IDLE')}
                                </span>
                            </div>
                        </div>

                        {/* Productivity Score / Hours */}
                        <div className="px-4 py-2 bg-brand-bg border border-brand-border/50 rounded-2xl min-w-[110px] flex flex-col items-center justify-center gap-1 shadow-inner hover:border-brand-primary/30 transition-colors">
                            <span className="text-base font-black text-brand-text tracking-tighter">
                                {calculateWorkingHours(clockedInTime, clockedOutTime, sessionLocation.workHours)}
                            </span>
                            <span className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Duration</span>
                        </div>
                    </div>

                    {/* Quick Access Buttons */}
                    <div className="flex bg-brand-bg border border-brand-border rounded-[2rem] p-2 gap-2 shadow-inner">
                        <button
                            onClick={!isCheckedIn && !isCheckedOut ? markAttendance : undefined}
                            disabled={isCheckedIn || isCheckedOut}
                            className={cn(
                                "flex items-center justify-center gap-3 px-8 py-4 rounded-3xl text-sm font-black tracking-tight transition-all active:scale-95 group/btn",
                                (isCheckedIn || isCheckedOut)
                                    ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20 opacity-80 cursor-not-allowed"
                                    : "bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/30"
                            )}
                        >
                            <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            {isCheckedOut ? "Day Completed" : isCheckedIn ? "Logged In" : "Login Session"}
                        </button>
                        <button
                            onClick={isCheckedIn && !isCheckedOut ? markAttendance : undefined}
                            disabled={!isCheckedIn || isCheckedOut}
                            className={cn(
                                "flex items-center justify-center gap-3 px-8 py-4 rounded-3xl text-sm font-black tracking-tight transition-all active:scale-95 border group/btn",
                                !isCheckedIn || isCheckedOut
                                    ? "text-brand-muted border-brand-border opacity-50 cursor-not-allowed"
                                    : "bg-brand-surface hover:bg-brand-bg border-brand-border text-brand-text hover:text-brand-primary hover:border-brand-primary/30 shadow-sm"
                            )}
                        >
                            <LogOut className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
                            {isCheckedOut ? "Logged Out" : "End Session"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Attendance Check-in Modal */}
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
                                            <CheckCircle className="w-5 h-5 text-white" />
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

            {/* Recent leave requests */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
                    <h3 className="font-bold text-brand-text">Recent Leave Requests</h3>
                    <span className="text-xs text-brand-muted">{leaves.filter((l: any) => l.status === 'Pending').length} pending</span>
                </div>
                <div className="divide-y divide-brand-border">
                    {leaves.slice(0, 5).map((l: any) => (
                        <div key={l._id || l.id} className="px-6 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-brand-text">{l.employeeName || l.name || '—'}</p>
                                <p className="text-xs text-brand-muted">{l.type} · {l.startDate} → {l.endDate}</p>
                            </div>
                            <Badge status={l.status} />
                        </div>
                    ))}
                    {!leaves.length && <p className="px-6 py-4 text-sm text-brand-muted">No leave requests found.</p>}
                </div>
            </div>
        </div>
    );
};

// ─── Section: Employees ───────────────────────────────────────────────────────
const EmployeesSection = ({ employees, onRefresh: _onRefresh }: { employees: any[]; onRefresh: () => void }) => {
    const [q, setQ] = useState('');
    const [profile, setProfile] = useState<any>(null);

    const generateNextEmployeeId = () => {
        if (!employees || employees.length === 0) return 'EMP001';
        let maxId = 0;
        employees.forEach(emp => {
            const match = (emp.employeeId || '').match(/^EMP(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });
        return `EMP${String(maxId + 1).padStart(3, '0')}`;
    };

    const filtered = employees
        .filter(e => e.role !== 'hr' && e.department !== 'Human Resources')
        .filter(e =>
            e.name?.toLowerCase().includes(q.toLowerCase()) ||
            e.email?.toLowerCase().includes(q.toLowerCase()) ||
            e.department?.toLowerCase().includes(q.toLowerCase())
        );

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-black text-brand-text">Employee Management</h2>
                    <p className="text-sm text-brand-muted mt-0.5">View and manage all employee profiles.</p>
                </div>
                <button 
                    onClick={() => setProfile({ isNew: true, employeeId: generateNextEmployeeId() })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-brand-primary/20"
                >
                    <UserPlus className="w-4 h-4" /> Add Employee
                </button>
            </div>
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input
                    value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search employees…"
                    className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
                />
            </div>
            <div className="flex flex-col gap-4">
                {filtered.map((emp: any) => (
                    <div
                        key={emp._id || emp.id}
                        onClick={() => setProfile(emp)}
                        className="bg-[#1a1c2e] border border-brand-border/40 rounded-xl p-3.5 hover:border-brand-primary/60 transition-all cursor-pointer group hover:bg-[#22253d] shadow-sm flex flex-col lg:flex-row lg:items-center gap-4"
                    >
                        {/* 1. Profile Section */}
                        <div className="flex items-center gap-3 lg:w-1/4 min-w-[180px]">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-blue-500 flex items-center justify-center text-white text-base font-black shadow-lg shadow-brand-primary/10 flex-shrink-0">
                                {emp.name?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-brand-text truncate group-hover:text-brand-primary transition-colors text-sm">{emp.name}</h3>
                                <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-0.5">
                                    {emp.role || 'Staff'} · {emp.department}
                                </p>
                            </div>
                        </div>

                        {/* 2. Contact Section */}
                        <div className="flex flex-col sm:flex-row lg:flex-row gap-3 lg:flex-1">
                            <div className="flex items-center gap-2 text-brand-muted text-xs font-medium min-w-[160px]">
                                <Mail className="w-3.5 h-3.5 text-brand-primary/70" />
                                <span className="truncate">{emp.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-brand-muted text-xs font-medium min-w-[120px]">
                                <Phone className="w-3.5 h-3.5 text-brand-primary/70" />
                                <span>{emp.phone || '—'}</span>
                            </div>
                        </div>

                        {/* 3. Status & Date Section */}
                        <div className="flex items-center gap-6 lg:w-1/4">
                            <div className="hidden sm:block">
                                <p className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-50 mb-0.5">Status</p>
                                <Badge status={emp.status || 'Active'} />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-50 mb-0.5">Joined</p>
                                <p className="text-xs text-brand-text font-bold">{emp.joiningDate || '—'}</p>
                            </div>
                        </div>

                        {/* 4. Action Section */}
                        <div className="flex items-center gap-2 lg:ml-auto">
                            <button
                                onClick={(e) => { e.stopPropagation(); setProfile(emp); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-lg text-[11px] font-bold hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                            >
                                <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                                onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    if(window.confirm('Delete ' + emp.name + '?')) {
                                        await api.delete('/api/employees/' + (emp.employeeId || emp.id));
                                        _onRefresh();
                                    }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-lg text-[11px] font-bold hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            >
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!filtered.length && (
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] py-20 text-center">
                    <p className="text-brand-muted text-sm font-medium">No employees found matching your search.</p>
                </div>
            )}

            {/* Add/Edit modal */}
            {profile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProfile(null)}>
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-brand-text">{profile.isNew ? 'Add New Employee' : 'Edit Employee'}</h3>
                            <button onClick={() => setProfile(null)} className="text-brand-muted hover:text-brand-text"><XCircle className="w-5 h-5" /></button>
                        </div>
                        <form className="space-y-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = Object.fromEntries(formData.entries());
                            try {
                                if (profile.isNew) {
                                    await api.post('/api/employees', { ...data, status: 'Active' });
                                } else {
                                    await api.put('/api/employees/' + (profile.employeeId || profile.id), data);
                                }
                                setProfile(null);
                                _onRefresh();
                            } catch (err: any) { alert(err.response?.data?.message || err.message); }
                        }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Full Name</label>
                                    <input name="name" defaultValue={profile.name} required className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Employee ID</label>
                                    <input name="employeeId" defaultValue={profile.employeeId} required className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Email</label>
                                    <input name="email" type="email" defaultValue={profile.email} required className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Phone</label>
                                    <input name="phone" defaultValue={profile.phone} className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Department</label>
                                    <input name="department" defaultValue={profile.department} required className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Role</label>
                                    <input name="role" defaultValue={profile.role} required className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Joining Date</label>
                                    <input name="joiningDate" type="date" defaultValue={profile.joiningDate} required className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                </div>
                            </div>
                            {profile.isNew && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Username</label>
                                        <input name="username" required className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Password</label>
                                        <input name="password" type="password" required className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 block px-1">Status</label>
                                    <select name="status" defaultValue={profile.status || 'Active'} className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                                        <option>Active</option>
                                        <option>On Break</option>
                                        <option>Resigned</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setProfile(null)} className="flex-1 py-3 border border-brand-border text-brand-muted rounded-xl font-bold text-sm hover:bg-brand-bg transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all">
                                    {profile.isNew ? 'Create Employee' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Section: Attendance ──────────────────────────────────────────────────────
const AttendanceSection = ({ attendance, employees }: any) => {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
    const today = new Date().toISOString().split('T')[0];

    const todayRecords = attendance.filter((a: any) => a.date === today);
    const presentCount = todayRecords.filter((a: any) => ['Present', 'Late', 'Half Day'].includes(a.status)).length;
    const absentCount = Math.max((employees?.length || 0) - presentCount, 0);
    const lateCount = todayRecords.filter((a: any) => a.status === 'Late').length;

    if (viewMode === 'my') {
        return (
            <div className="space-y-5">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-black text-brand-text">My Attendance</h2>
                        <p className="text-sm text-brand-muted mt-0.5">Track your personal attendance.</p>
                    </div>
                    <button onClick={() => setViewMode('all')} className="px-4 py-2 bg-brand-surface border border-brand-border text-brand-text rounded-xl text-sm font-bold hover:bg-brand-bg transition-colors">
                        Back to All Attendance
                    </button>
                </div>
                <EmployeeAttendance />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-brand-text">Attendance Management</h2>
                    <p className="text-sm text-brand-muted mt-0.5">Track daily, weekly and monthly attendance.</p>
                </div>
                <button onClick={() => setViewMode('my')} className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
                    My Attendance
                </button>
            </div>
            <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                        className={cn('px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                            period === p ? 'bg-brand-primary text-white' : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-text')}>
                        {p}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Present', count: presentCount, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                    { label: 'Absent', count: absentCount, color: 'text-rose-600', bg: 'bg-rose-500/10' },
                    { label: 'Late', count: lateCount, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                ].map(({ label, count, color, bg }) => (
                    <div key={label} className={cn('rounded-2xl p-5 border border-brand-border', bg)}>
                        <p className={cn('text-3xl font-black', color)}>{count}</p>
                        <p className="text-xs text-brand-muted uppercase tracking-widest font-bold mt-1">{label} Today</p>
                    </div>
                ))}
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-brand-border bg-brand-bg">
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">
                        {period === 'daily' ? `Today — ${today}` : period === 'weekly' ? 'This Week' : 'This Month'}
                    </p>
                </div>
                <table className="w-full text-left">
                    <thead className="border-b border-brand-border">
                        <tr>{['Employee', 'Date', 'Check In', 'Check Out', 'Status'].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-muted">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {todayRecords.slice(0, 20).map((rec: any) => (
                            <tr key={rec._id || rec.id} className="hover:bg-brand-bg/40 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-brand-text">
                                    {employees?.find((e: any) => e.id === rec.employeeId)?.name || rec.employeeName || rec.name || rec.employeeId}
                                </td>
                                <td className="px-4 py-3 text-xs text-brand-muted">{rec.date}</td>
                                <td className="px-4 py-3 text-xs text-brand-muted">{rec.checkIn || '—'}</td>
                                <td className="px-4 py-3 text-xs text-brand-muted">{rec.checkOut || '—'}</td>
                                <td className="px-4 py-3"><Badge status={rec.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!todayRecords.length && <p className="px-6 py-8 text-center text-brand-muted text-sm">No attendance records for today.</p>}
            </div>
        </div>
    );
};

// ─── Section: Leaves ──────────────────────────────────────────────────────────
const LeavesSection = ({ leaves, onRefresh }: any) => {
    const [filter, setFilter] = useState('All');
    const [q, setQ] = useState('');

    const visible = leaves
        .filter((l: any) => filter === 'All' || l.status === filter)
        .filter((l: any) => (l.employeeName || l.name || '').toLowerCase().includes(q.toLowerCase()));

    const update = async (id: string, status: 'Approved' | 'Rejected') => {
        try { await api.put(`/api/leaves/${id}`, { status }); onRefresh(); }
        catch (e: any) { alert(e.message); }
    };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-black text-brand-text">Leave Management</h2>
                <p className="text-sm text-brand-muted mt-0.5">Approve or reject employee leave requests.</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={cn('px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all',
                            filter === s ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-muted hover:text-brand-text')}>
                        {s}
                    </button>
                ))}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name…"
                        className="w-full pl-9 pr-3 py-1.5 bg-brand-surface border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                </div>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-brand-bg border-b border-brand-border">
                        <tr>{['Employee', 'Type', 'Duration', 'Reason', 'Status', 'Actions'].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-muted">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {visible.map((l: any) => (
                            <tr key={l._id || l.id} className="hover:bg-brand-bg/40 transition-colors group">
                                <td className="px-4 py-3 text-sm font-semibold text-brand-text">{l.employeeName || l.name || '—'}</td>
                                <td className="px-4 py-3 text-xs text-brand-muted">{l.type}</td>
                                <td className="px-4 py-3 text-xs text-brand-muted">{l.startDate} → {l.endDate}</td>
                                <td className="px-4 py-3 text-xs text-brand-muted max-w-[150px] truncate">{l.reason || '—'}</td>
                                <td className="px-4 py-3"><Badge status={l.status} /></td>
                                <td className="px-4 py-3">
                                    {l.status === 'Pending' && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => update(l._id || l.id, 'Approved')}
                                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg transition-all"><CheckCircle className="w-4 h-4" /></button>
                                            <button onClick={() => update(l._id || l.id, 'Rejected')}
                                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg transition-all"><XCircle className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!visible.length && <p className="px-6 py-8 text-center text-brand-muted text-sm">No leave requests found.</p>}
            </div>
        </div>
    );
};

// ─── Section: Announcements ────────────────────────────────────────────────────
const AnnouncementsSection = () => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', priority: 'Normal' });

    const fetch_ = useCallback(async () => {
        try {
            const res = await api.get('/api/announcements');
            const data = await res.json();
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetch_(); }, [fetch_]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/announcements', form);
            if (res.ok) { setShowModal(false); setForm({ title: '', content: '', priority: 'Normal' }); fetch_(); }
        } catch (err: any) { alert(err.message); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-brand-text">Announcements</h2>
                    <p className="text-sm text-brand-muted mt-0.5">Post and manage company-wide announcements.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
                    <Plus className="w-4 h-4" /> New Announcement
                </button>
            </div>
            <div className="space-y-3">
                {announcements.map((a: any) => (
                    <div key={a._id || a.id} className="bg-brand-surface border border-brand-border rounded-xl p-5 hover:border-brand-primary/30 transition-all">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-brand-text">{a.title}</h4>
                                <p className="text-sm text-brand-muted mt-1">{a.content}</p>
                            </div>
                            <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0',
                                a.priority === 'High' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                                    a.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                        'bg-brand-bg text-brand-muted border border-brand-border'
                            )}>{a.priority || 'Normal'}</span>
                        </div>
                        <p className="text-xs text-brand-muted/60 mt-3">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</p>
                    </div>
                ))}
                {!announcements.length && (
                    <div className="bg-brand-surface border border-brand-border rounded-2xl py-16 text-center">
                        <Bell className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-30" />
                        <p className="text-brand-muted text-sm">No announcements yet. Create one!</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-black text-brand-text">New Announcement</h3>
                            <button onClick={() => setShowModal(false)}><XCircle className="w-5 h-5 text-brand-muted" /></button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-1.5">Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    placeholder="Announcement title…"
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-1.5">Message</label>
                                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required rows={4}
                                    placeholder="Write your announcement…"
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-1.5">Priority</label>
                                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                                    <option>Normal</option><option>Medium</option><option>High</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-brand-border text-brand-muted rounded-xl font-bold text-sm hover:bg-brand-bg transition-all">Cancel</button>
                                <button type="submit"
                                    className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all">Post</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Section: Tasks ────────────────────────────────────────────────────────────
const TasksSection = ({ employees }: { employees: any[] }) => {
    const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
    const [tasks, setTasks] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        employeeId: '',
        projectName: '',
        description: '',
        priority: 'Medium',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchTasks = useCallback(async () => {
        try {
            const res = await api.get('/api/tasks');
            const data = await res.json();
            setTasks(Array.isArray(data) ? data.slice().reverse() : []);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/tasks', { ...form, status: 'Pending' });
            if (res.ok) {
                setShowModal(false);
                setForm({ employeeId: '', projectName: '', description: '', priority: 'Medium', date: new Date().toISOString().split('T')[0] });
                fetchTasks();
            }
        } catch (err: any) { alert(err.message); }
    };

    if (viewMode === 'my') {
        return (
            <div className="space-y-5">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-black text-brand-text">My Tasks</h2>
                        <p className="text-sm text-brand-muted mt-0.5">Manage your assigned tasks.</p>
                    </div>
                    <button onClick={() => setViewMode('all')} className="px-4 py-2 bg-brand-surface border border-brand-border text-brand-text rounded-xl text-sm font-bold hover:bg-brand-bg transition-colors">
                        Back to All Tasks
                    </button>
                </div>
                <EmployeeTasks />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-brand-text">Task Management</h2>
                    <p className="text-sm text-brand-muted mt-0.5">Assign and track tasks for employees.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setViewMode('my')} className="px-4 py-2 bg-brand-surface border border-brand-border text-brand-text rounded-xl text-sm font-bold hover:bg-brand-bg transition-colors">
                        My Tasks
                    </button>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
                        <Plus className="w-4 h-4" /> Assign New Task
                    </button>
                </div>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-brand-bg border-b border-brand-border">
                        <tr>{['Employee', 'Project', 'Activity', 'Priority', 'Status', 'Date'].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-muted">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {tasks.filter((t: any) => employees.some(e => e.employeeId === t.employeeId || e.id === t.employeeId)).map((t: any) => (
                            <tr key={t._id || t.id} className="hover:bg-brand-bg/40 transition-colors">
                                <td className="px-4 py-3 text-sm font-semibold text-brand-text">
                                    {employees.find(e => e.employeeId === t.employeeId || e.id === t.employeeId)?.name || t.employeeId}
                                </td>
                                <td className="px-4 py-3 text-xs text-brand-text">{t.projectName || '—'}</td>
                                <td className="px-4 py-3 text-xs text-brand-muted max-w-[200px] truncate">{t.description}</td>
                                <td className="px-4 py-3 text-xs">
                                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                                        t.priority === 'High' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                        t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                        'bg-brand-bg text-brand-muted border-brand-border')}>
                                        {t.priority}
                                    </span>
                                </td>
                                <td className="px-4 py-3"><Badge status={t.status} /></td>
                                <td className="px-4 py-3 text-xs text-brand-muted">{t.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!tasks.length && (
                    <div className="py-20 text-center">
                        <FileText className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-30" />
                        <p className="text-brand-muted text-sm border-0 border-transparent">No tasks assigned yet.</p>
                    </div>
                )}
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-brand-text">Assign New Task</h3>
                            <button onClick={() => setShowModal(false)}><XCircle className="w-5 h-5 text-brand-muted" /></button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-1.5">Employee</label>
                                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text text-sm focus:outline-none">
                                    <option value="">Select Employee</option>
                                    {employees.map(e => <option key={e.id} value={e.employeeId}>{e.name} ({e.employeeId})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-1.5">Project Name</label>
                                <input value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-1.5">Task Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text text-sm focus:outline-none resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-1.5">Priority</label>
                                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text text-sm focus:outline-none">
                                        <option>Low</option><option>Medium</option><option>High</option>
                                    </select>
                                </div>
                                <div><label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-1.5">Due Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text text-sm focus:outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-brand-border text-brand-muted rounded-xl font-bold text-sm hover:bg-brand-bg transition-all">Cancel</button>
                                <button type="submit"
                                    className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all">Assign Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Section: Settings ────────────────────────────────────────────────────────
const HRSettings = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    
    const [empFormData, setEmpFormData] = useState({
        username: user.username || '',
        email: user.email || '',
        password: ''
    });
    const [empLoading, setEmpLoading] = useState(false);
    const [empMessage, setEmpMessage] = useState('');
    const [empShowPassword, setEmpShowPassword] = useState(false);

    const handleEmployeeUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmpLoading(true);
        setEmpMessage('');

        try {
            const { password, ...rest } = empFormData;
            const payload = password ? { ...rest, password } : rest;

            const response = await api.put(`/api/employees/${user.id}`, payload);
            if (response.ok) {
                setEmpMessage('Your credentials have been updated successfully!');
                const updatedUser = await response.json();
                localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
            } else {
                setEmpMessage('Failed to update credentials.');
            }
        } catch (error) {
            setEmpMessage('An error occurred while updating.');
        } finally {
            setEmpLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-black text-brand-text tracking-tight">Settings</h1>
                <p className="text-brand-muted font-medium mt-1">Manage your HR account credentials</p>
            </div>
            
            <div className="bg-brand-surface border border-brand-border rounded-[2rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-brand-border bg-gradient-to-r from-brand-bg to-brand-surface">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                            <Shield className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-brand-text uppercase tracking-widest">Personal Credentials</h2>
                            <p className="text-xs font-bold text-brand-muted mt-1 uppercase tracking-wider">Update your access details</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleEmployeeUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                <input
                                    type="text"
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                    value={empFormData.username}
                                    onChange={(e) => setEmpFormData({ ...empFormData, username: e.target.value })}
                                    placeholder="Enter unique username"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                <input
                                    type="email"
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                    value={empFormData.email}
                                    onChange={(e) => setEmpFormData({ ...empFormData, email: e.target.value })}
                                    placeholder="your.email@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">New Password (Optional)</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                <input
                                    type={empShowPassword ? "text" : "password"}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-12 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                    value={empFormData.password}
                                    onChange={(e) => setEmpFormData({ ...empFormData, password: e.target.value })}
                                    placeholder="Leave blank to keep current"
                                />
                                <button type="button" onClick={() => setEmpShowPassword(!empShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2">
                                    {empShowPassword ? <EyeOff className="w-5 h-5 text-brand-muted" /> : <Eye className="w-5 h-5 text-brand-muted" />}
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-brand-border">
                            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{empMessage}</span>
                            <button type="submit" disabled={empLoading} className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20">
                                {empLoading ? 'Updating...' : 'Update Credentials'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ─── Main HRPortal ────────────────────────────────────────────────────────────
const HRPortal: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [section, setSection] = useState('overview');
    const [sidebar, setSidebar] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);

    const fetchAll = useCallback(async () => {
        try {
            const [empRes, leavesRes, attRes] = await Promise.all([
                api.get('/api/employees'),
                api.get('/api/leaves'),
                api.get('/api/attendance'),
            ]);
            const allEmps = await empRes.json();
            const filteredEmps = Array.isArray(allEmps) ? allEmps.filter((e: any) => e.role !== 'admin' && e.role !== 'subadmin') : [];
            setEmployees(filteredEmps);
            setLeaves(await leavesRes.json());
            setAttendance(await attRes.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const renderSection = () => {
        switch (section) {
            case 'overview':     return <Overview employees={employees} leaves={leaves} attendance={attendance} onRefresh={fetchAll} />;
            case 'employees':    return <EmployeesSection employees={employees} onRefresh={fetchAll} />;
            case 'attendance':   return <AttendanceSection attendance={attendance} employees={employees} />;
            case 'leaves':       return <LeavesSection leaves={leaves} employees={employees} onRefresh={fetchAll} />;
            case 'payroll':      return <AdminPayroll />;
            case 'permissions':  return <Permissions />;
            case 'expenses':     return <EmployeeExpenses />;
            case 'announcements':return <AnnouncementsSection />;
            case 'task-assignment':return <TasksSection employees={employees} />;
            case 'jobs':         return <JobsTab showAll />;
            case 'resignation':  return <ResignationTab role="hr" />;
            case 'settings':     return <HRSettings />;
            default:             return null;
        }
    };

    return (
        <div className="h-screen flex overflow-hidden bg-brand-bg text-brand-text font-sans">
            {/* Mobile overlay */}
            {sidebar && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebar(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                'fixed inset-y-0 left-0 w-64 bg-brand-surface border-r border-brand-border flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen',
                sidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="flex items-center justify-between p-5 border-b border-brand-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-brand-primary flex-shrink-0">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                             <p className="text-sm font-bold text-brand-text">Forge India Connect</p>
                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">HR Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebar(false)}
                        className="lg:hidden p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
                    {NAV.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => { setSection(id); setSidebar(false); }}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-left',
                                section === id
                                    ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20'
                                    : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'
                            )}>
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* User info + logout */}
                <div className="p-4 border-t border-brand-border flex-shrink-0">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-brand-bg border border-brand-border">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-blue-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                            {user.name?.charAt(0) || 'H'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-brand-text truncate">{user.name || 'HR Manager'}</p>
                            <p className="text-[10px] text-brand-muted uppercase tracking-widest font-black opacity-60">{user.role || 'HR'}</p>
                        </div>
                        <button
                            onClick={logout}
                            title="Logout"
                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-brand-muted hover:text-rose-500 transition-colors flex-shrink-0"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* ── Mobile top navbar ─────────────────────────── */}
                <header className="lg:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 bg-brand-surface border-b border-brand-border sticky top-0 z-30 shadow-sm">
                    <button
                        onClick={() => setSidebar(true)}
                        className="p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary/30 transition-all active:scale-95"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg overflow-hidden">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-brand-text leading-none">HR Portal</p>
                            <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest leading-none mt-0.5">Forge India Connect</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-muted hover:text-rose-500 hover:border-rose-500/30 transition-all active:scale-95"
                        aria-label="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </header>

                {/* ── Page content ──────────────────────────────── */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-7xl mx-auto">
                        {renderSection()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HRPortal;
