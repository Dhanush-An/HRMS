import React, { useState } from 'react';
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
    CreditCard
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/forge india logo.jpg';

const SubAdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (!token || !user) {
            navigate('/login');
        }
    }, [navigate]);

    const location = useLocation();
    const [showProfile, setShowProfile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const branchName = user?.branchName || 'Branch';

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/subadmin-dashboard' },
        { icon: Building2, label: 'HR', path: '/subadmin-dashboard/hr' },
        { icon: Users, label: 'Employees', path: '/subadmin-dashboard/employees' },
        { icon: Calendar, label: 'Attendance', path: '/subadmin-dashboard/attendance' },
        { icon: DollarSign, label: 'Salary', path: '/subadmin-dashboard/payroll' },
        { icon: FileText, label: 'Leaves', path: '/subadmin-dashboard/leaves' },
        { icon: CreditCard, label: 'Expenses', path: '/subadmin-dashboard/expenses' },
        { icon: TrendingUp, label: 'Performance', path: '/subadmin-dashboard/performance' },
        { icon: File, label: 'Documents', path: '/subadmin-dashboard/documents' },
        { icon: Briefcase, label: 'Jobs', path: '/subadmin-dashboard/jobs' },
        { icon: LogOut, label: 'Resignation', path: '/subadmin-dashboard/resignation' },
        { icon: Settings, label: 'Settings', path: '/subadmin-dashboard/settings' },
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
                            className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                <main className="flex-1 p-4 md:p-8 overflow-y-auto relative bg-brand-bg no-scrollbar">
                    <Outlet />
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
        </div>
    );
};

export default SubAdminDashboard;
