import React, { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    ShieldCheck,
    TrendingUp,
    DollarSign,
    Calendar,
    BarChart2,
    File,
    Bell,
    Sun,
    Moon,
    Menu,
    X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        console.log(`[ADMIN DASHBOARD] Mount check - Token: ${!!token}, User: ${!!user}`);
        if (!token || !user) {
            navigate('/login');
        }
    }, [navigate]);

    const location = useLocation();
    const [showProfile, setShowProfile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin-dashboard' },
        { icon: Users, label: 'Employees', path: '/admin-dashboard/employees' },
        { icon: Calendar, label: 'Attendance', path: '/admin-dashboard/attendance' },
        { icon: DollarSign, label: 'Payroll', path: '/admin-dashboard/payroll' },
        { icon: FileText, label: 'Leaves', path: '/admin-dashboard/leaves' },
        { icon: TrendingUp, label: 'Performance', path: '/admin-dashboard/performance' },
        { icon: File, label: 'Documents', path: '/admin-dashboard/documents' },
        { icon: Bell, label: 'Announcements', path: '/admin-dashboard/announcements' },
        { icon: BarChart2, label: 'Reports', path: '/admin-dashboard/reports' },
        { icon: Settings, label: 'Settings', path: '/admin-dashboard/settings' },
    ];

    return (
        <div className="h-screen bg-brand-bg text-brand-text flex overflow-hidden font-sans relative">
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
                                src="/logo.jpg"
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
                                <p className="text-sm font-semibold text-brand-text group-hover:text-brand-primary transition-colors">Admin</p>
                                <p className="text-xs text-brand-muted italic">Admin</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group/logout"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5 text-brand-muted group-hover/logout:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Top Nav */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20">
                            <span className="text-white font-black italic text-xs tracking-tighter">aG</span>
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

                <main className="flex-1 p-4 md:p-8 overflow-y-auto relative bg-brand-bg no-scrollbar">
                    <Outlet />
                </main>
            </div>

            {/* Profile Modal */}
            {showProfile && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProfile(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-primary to-blue-400 p-[2px] mb-4 shadow-xl">
                                <div className="w-full h-full rounded-[14px] bg-brand-bg flex items-center justify-center overflow-hidden">
                                    <ShieldCheck className="w-10 h-10 text-brand-primary" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-brand-text mb-1">Admin User</h2>
                            <p className="text-brand-primary font-semibold mb-6">System Administrator</p>

                            <div className="w-full space-y-4 text-left bg-brand-bg p-5 rounded-2xl border border-brand-border">
                                <div>
                                    <label className="text-[10px] text-brand-muted uppercase font-bold tracking-widest block mb-1">Email</label>
                                    <p className="text-brand-text font-medium text-sm">admin@hrms.com</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-brand-muted uppercase font-bold tracking-widest block mb-1">Role</label>
                                    <p className="text-brand-text font-medium text-sm">Super Admin</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-brand-muted uppercase font-bold tracking-widest block mb-1">User ID</label>
                                    <p className="text-brand-text font-mono text-sm tracking-tighter">ADMIN-001</p>
                                </div>
                            </div>

                            <div className="w-full mt-6 flex items-center justify-between p-4 bg-brand-bg rounded-2xl border border-brand-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-brand-surface border border-brand-border text-brand-primary">
                                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    </div>
                                    <span className="text-sm font-bold text-brand-text">Theme Mode</span>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none bg-brand-primary"
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-lg",
                                            theme === 'dark' ? "translate-x-6" : "translate-x-1"
                                        )}
                                    />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowProfile(false)}
                                className="mt-8 w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-2xl transition-all font-bold text-sm shadow-lg shadow-brand-primary/20 active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
