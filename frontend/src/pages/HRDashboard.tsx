import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    TrendingUp,
    Bell,
    LogOut,
    Menu,
    X,
    Building2,
    ArrowLeft,
    Clock,
    Briefcase,
    UserCheck,
    UserX,
    Activity,
    Target,
    MessageSquare,
    ArrowUpRight,
    Heart,
    Star,
    Award,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '../utils/cn';
import logo from '../assets/antigraviity logo 2.jpg';
import { motion } from 'framer-motion';

// ─── Stat Card (same as EmployeeHome) ───────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-brand-surface border border-brand-border p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] hover:shadow-2xl transition-all group relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-all duration-700" />
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={cn('p-4 rounded-2xl group-hover:scale-110 transition-all duration-500 shadow-xl shadow-black/5 border border-white/10', color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>Live</span>
            </div>
        </div>
        <div className="relative z-10">
            <h3 className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 group-hover:opacity-100 transition-opacity">{title}</h3>
            <p className="text-3xl font-black text-brand-text tracking-tighter group-hover:text-brand-primary transition-colors">{value}</p>
        </div>
    </motion.div>
);

// ─── Sidebar menu items ──────────────────────────────────────────────────────
const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', section: 'home' },
    { icon: Users, label: 'HR Team', section: 'team' },
    { icon: Calendar, label: 'Attendance', section: 'attendance' },
    { icon: FileText, label: 'Leave Requests', section: 'leaves' },
    { icon: TrendingUp, label: 'Performance', section: 'performance' },
    { icon: Briefcase, label: 'Recruitment', section: 'recruitment' },
    { icon: Bell, label: 'Announcements', section: 'announcements' },
];

// ─── Mock HR stats ───────────────────────────────────────────────────────────
const hrStats = {
    headcount: '248',
    openRoles: '15',
    onLeaveToday: '8',
    newHiresMTD: '18',
};

// ─── Recent activity feed ────────────────────────────────────────────────────
const recentActivities = [
    { type: 'Onboarding', status: 'Completed', info: 'New Employee Induction', date: '2 hrs ago', icon: UserCheck },
    { type: 'Recruitment', status: 'Shortlisted', info: 'Senior Dev Interviews', date: 'Yesterday', icon: Briefcase },
    { type: 'Leave', status: 'Approved', info: 'Leave Request Processed', date: '2 days ago', icon: CheckCircle2 },
];

// ─── Section content renderer ────────────────────────────────────────────────
const SectionContent = ({ section }: { section: string }) => {
    if (section === 'home') {
        return (
            <div className="p-4 md:p-8 space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Greeting banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-brand-muted font-medium italic text-base md:text-lg leading-relaxed max-w-2xl">
                            "Great HR doesn't just fill positions — it builds teams that move mountains."
                        </p>
                        <p className="text-brand-primary font-black uppercase tracking-widest text-[10px] mt-2">— HR Department</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <Heart className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-600">Engagement 87%</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
                            <Star className="w-3.5 h-3.5 text-brand-primary" />
                            <span className="text-xs font-semibold text-brand-primary">eNPS: 42</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    <StatCard title="Total Headcount" value={hrStats.headcount} icon={Users} color="bg-brand-primary" delay={0.1} />
                    <StatCard title="Open Positions" value={hrStats.openRoles} icon={Briefcase} color="bg-violet-500" delay={0.2} />
                    <StatCard title="On Leave Today" value={hrStats.onLeaveToday} icon={UserX} color="bg-rose-500" delay={0.3} />
                    <StatCard title="New Hires (MTD)" value={hrStats.newHiresMTD} icon={UserCheck} color="bg-emerald-500" delay={0.4} />
                </div>

                {/* Content row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                    {/* Recent activity */}
                    <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl md:rounded-[3rem] p-5 md:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <Activity className="w-48 h-48" />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                            <h2 className="text-lg md:text-xl font-black text-brand-text uppercase tracking-widest flex items-center gap-4">
                                Recent HR Activity
                                <div className="hidden sm:block h-px w-20 bg-brand-primary opacity-20" />
                            </h2>
                            <button className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all flex items-center gap-2">
                                View All Logs <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="space-y-8">
                            {recentActivities.map((activity, i) => (
                                <div key={i} className="flex gap-6 items-start group">
                                    <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center flex-shrink-0 border border-brand-border shadow-inner group-hover:border-brand-primary transition-all duration-500">
                                        <activity.icon className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-brand-text uppercase tracking-tight text-lg">{activity.info}</h4>
                                            <span className="text-[9px] text-brand-muted uppercase font-black tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">{activity.date}</span>
                                        </div>
                                        <p className="text-sm font-medium text-brand-muted leading-relaxed">
                                            {activity.type} record has been{' '}
                                            <span className="text-brand-primary font-black uppercase tracking-widest mx-1">{activity.status.toLowerCase()}</span>
                                            successfully.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="space-y-6 md:space-y-10">
                        <div className="bg-brand-surface border border-brand-border rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-12 -right-12 p-8 opacity-[0.05] group-hover:scale-125 group-hover:rotate-45 transition-all duration-700">
                                <Clock className="w-48 h-48" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase mb-2 text-brand-text">Add Employee</h3>
                                    <p className="text-brand-muted text-sm font-medium leading-relaxed italic">Onboard new team members into the system.</p>
                                </div>
                                <button className="w-full bg-brand-primary text-white hover:bg-white hover:text-brand-primary px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all border-b-4 border-brand-primary/20 hover:border-brand-bg">
                                    Onboard Now
                                </button>
                            </div>
                        </div>

                        <div className="bg-brand-surface border border-brand-border rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-xl group relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 p-6 opacity-5">
                                <MessageSquare className="w-20 h-20" />
                            </div>
                            <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest mb-6 opacity-60">HR Insight</h3>
                            <p className="italic text-brand-muted font-medium leading-relaxed text-lg">
                                "Happy employees create happy customers — HR is the bridge between the two."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Generic placeholder for other sections
    const labels: Record<string, { icon: React.ElementType; title: string; desc: string }> = {
        team: { icon: Users, title: 'HR Team', desc: 'View and manage your HR personnel.' },
        attendance: { icon: Calendar, title: 'Attendance', desc: 'Track HR department attendance records.' },
        leaves: { icon: FileText, title: 'Leave Requests', desc: 'Review and approve employee leave requests.' },
        performance: { icon: TrendingUp, title: 'Performance', desc: 'Monitor HR-driven performance metrics.' },
        recruitment: { icon: Briefcase, title: 'Recruitment', desc: 'Manage open roles and candidates.' },
        announcements: { icon: Bell, title: 'Announcements', desc: 'Post and view internal HR announcements.' },
    };
    const meta = labels[section] || { icon: Target, title: 'Section', desc: '' };
    const Icon = meta.icon;

    return (
        <div className="flex flex-col items-center justify-center h-full py-32 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-brand-primary" />
            </div>
            <h2 className="text-2xl font-black text-brand-text mb-2">{meta.title}</h2>
            <p className="text-brand-muted text-sm max-w-xs">{meta.desc}</p>
            <span className="mt-6 px-4 py-2 rounded-full bg-brand-surface border border-brand-border text-xs text-brand-muted font-semibold">Coming Soon</span>
        </div>
    );
};

// ─── Main component ──────────────────────────────────────────────────────────
const HRDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="h-screen bg-brand-bg text-brand-text flex overflow-hidden font-sans relative">
            {/* Mobile backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside className={cn(
                'fixed inset-y-0 left-0 w-72 border-r border-brand-border bg-brand-surface flex flex-col p-6 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:flex',
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="flex items-center justify-between mb-10 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-brand-primary to-blue-600">
                                <span className="text-white font-black italic text-lg tracking-tighter">aG</span>
                            </div>
                            <img src={logo} alt="Logo" className="absolute inset-0 w-full h-full object-cover z-10" />
                        </div>
                        <div>
                            <span className="text-base font-bold text-brand-text tracking-tight block">Antigraviity</span>
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> HR Portal
                            </span>
                        </div>
                    </div>
                    <button
                        className="lg:hidden p-2 hover:bg-brand-bg rounded-lg transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6 text-brand-muted" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-1 overflow-y-auto pr-2 no-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => { setActiveSection(item.section); setIsSidebarOpen(false); }}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                                activeSection === item.section
                                    ? 'bg-brand-primary-light text-brand-primary font-semibold shadow-sm'
                                    : 'hover:bg-brand-bg text-brand-muted hover:text-brand-text'
                            )}
                        >
                            <item.icon className={cn('w-5 h-5', activeSection === item.section ? 'text-brand-primary' : 'group-hover:text-brand-primary')} />
                            <span className={cn(
                                'text-sm',
                                activeSection === item.section ? 'text-brand-primary font-bold' : 'text-brand-muted group-hover:text-brand-text transition-colors'
                            )}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Footer — back button */}
                <div className="mt-4 pt-4 border-t border-brand-border">
                    <button
                        onClick={() => navigate('/admin-dashboard/hr')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:text-brand-primary transition-colors" />
                        <span className="text-sm group-hover:text-brand-text transition-colors">Back to HR</span>
                    </button>

                    <div className="mt-2 w-full flex items-center justify-between p-3 rounded-2xl bg-brand-bg border border-brand-border group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-blue-400 p-[2px]">
                                <div className="w-full h-full rounded-[10px] bg-brand-surface flex items-center justify-center overflow-hidden">
                                    <Award className="w-5 h-5 text-brand-primary" />
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-brand-text">HR Manager</p>
                                <p className="text-xs text-brand-muted italic">Human Resources</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group/logout"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5 text-brand-muted group-hover/logout:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile top nav */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-brand-primary to-blue-600">
                                <span className="text-white font-black italic text-xs tracking-tighter">aG</span>
                            </div>
                            <img src={logo} alt="Logo" className="absolute inset-0 w-full h-full object-cover z-10" />
                        </div>
                        <span className="text-lg font-bold text-brand-text tracking-tight">HR Portal</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-brand-bg rounded-lg transition-colors ring-1 ring-brand-border shadow-sm bg-brand-surface"
                    >
                        <Menu className="w-6 h-6 text-brand-primary" />
                    </button>
                </header>

                {/* Desktop section header */}
                <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-brand-border bg-brand-bg/80 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-brand-text leading-tight">HR Portal</h2>
                            <p className="text-[10px] text-brand-muted uppercase tracking-widest font-black">Human Resources</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin-dashboard/hr')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-border hover:bg-brand-surface text-brand-muted hover:text-brand-text transition-all text-sm font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to HR Overview
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto relative no-scrollbar bg-brand-bg">
                    <SectionContent section={activeSection} />
                </main>
            </div>
        </div>
    );
};

export default HRDashboard;
