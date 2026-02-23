import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '../utils/cn';

const EmployeeDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = React.useState<any>(null);
    const [isCheckedIn, setIsCheckedIn] = React.useState(false);
    const [isCheckedOut, setIsCheckedOut] = React.useState(false);
    const [clockedInTime, setClockedInTime] = React.useState('--:--');
    const [clockedOutTime, setClockedOutTime] = React.useState('--:--');
    const [attendanceId, setAttendanceId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchTodayAttendance(parsedUser.id);
        }
    }, []);

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

    const handleCheckIn = async () => {
        if (!user) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        const nineThirty = new Date();
        nineThirty.setHours(9, 30, 0, 0);

        const ten = new Date();
        ten.setHours(10, 0, 0, 0);

        let status = 'Present';
        if (now > ten) {
            status = 'Half Day';
        } else if (now > nineThirty) {
            status = 'Late';
        }

        try {
            const today = now.toISOString().split('T')[0];
            const res = await api.post('/api/attendance', {
                employeeId: user.id,
                employeeName: user.name,
                date: today,
                status,
                checkIn: timeString
            });
            const data = await res.json();

            setIsCheckedIn(true);
            setClockedInTime(timeString);
            setClockedOutTime('--:--');
            setAttendanceId(data.id);
        } catch (error) {
            console.error("Error checking in:", error);
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
        <div className="h-screen bg-brand-bg text-brand-text flex overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-72 border-r border-brand-border bg-brand-surface flex flex-col p-6 hidden lg:flex sticky top-0 h-screen transition-all">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 relative overflow-hidden">
                        {/* Fallback Branding */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-brand-primary to-blue-600">
                            <span className="text-white font-black italic text-lg tracking-tighter">aG</span>
                        </div>
                        {/* Dynamic Logo Image */}
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 opacity-0"
                            onLoad={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-100')}
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                    </div>
                    <span className="text-xl font-bold text-brand-text tracking-tight">Antigraviity</span>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto pr-2 no-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
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
                        onClick={() => navigate('/employee-dashboard/profile')}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-brand-bg border border-brand-border hover:bg-brand-surface hover:shadow-sm transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-blue-400 p-[2px]">
                                <div className="w-full h-full rounded-[10px] bg-brand-surface flex items-center justify-center overflow-hidden">
                                    <span className="text-sm font-bold text-brand-primary tracking-wider uppercase">{user.name?.charAt(0)}</span>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-brand-text whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{user.name}</p>
                                <p className="text-xs text-brand-muted whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{user.role}</p>
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

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen relative no-scrollbar bg-brand-bg">
                {/* Header */}
                {(location.pathname === '/employee-dashboard' || location.pathname === '/employee-dashboard/') && (
                    <header className="sticky top-0 z-30 flex items-center justify-between p-6 border-b border-brand-border bg-brand-bg/80 backdrop-blur-xl">
                        <div>
                            <h2 className="text-xl font-bold text-brand-text leading-none mb-1">Welcome, {user.name}</h2>
                            <p className="text-xs text-brand-muted uppercase font-bold tracking-widest">{user.role}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4 px-4 py-2 bg-brand-surface border border-brand-border rounded-xl shadow-sm">
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
                            <div className="flex bg-brand-surface border border-brand-border rounded-xl p-1 gap-1 shadow-sm">
                                <button
                                    onClick={handleCheckIn}
                                    disabled={isCheckedIn || isCheckedOut}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95",
                                        isCheckedIn || isCheckedOut
                                            ? "text-brand-muted bg-brand-bg cursor-not-allowed"
                                            : "bg-status-approved hover:opacity-90 text-white shadow-lg shadow-status-approved/20"
                                    )}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Login
                                </button>
                                <button
                                    onClick={handleCheckOut}
                                    disabled={!isCheckedIn || isCheckedOut}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95",
                                        !isCheckedIn || isCheckedOut
                                            ? "text-brand-muted bg-brand-bg cursor-not-allowed"
                                            : "bg-status-rejected hover:opacity-90 text-white shadow-lg shadow-status-rejected/20"
                                    )}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </header>
                )}

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;
