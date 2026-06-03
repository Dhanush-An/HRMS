import { useState, useEffect, useCallback } from 'react';
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
    Mail, Phone, Edit2, Trash2, UserPlus, Search, XCircle, ClipboardList
} from 'lucide-react';
import { cn } from '../utils/cn';
import logo from '../assets/forge india logo.jpg';
import { motion } from 'framer-motion';
import api from '../api';

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
    { icon: ClipboardList, label: 'Assign Task', section: 'tasks' },
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

// ─── Section: Employees ───────────────────────────────────────────────────────
const EmployeesSection = ({ employees, onRefresh: _onRefresh }: { employees: any[]; onRefresh: () => void }) => {
    const [q, setQ] = useState('');
    const [profile, setProfile] = useState<any>(null);

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
                    onClick={() => setProfile({ isNew: true })}
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
                        className="bg-[#1a1c2e] border border-brand-border/40 rounded-2xl p-5 hover:border-brand-primary/60 transition-all cursor-pointer group hover:bg-[#22253d] shadow-sm flex flex-col lg:flex-row lg:items-center gap-6"
                    >
                        <div className="flex items-center gap-4 lg:w-1/4 min-w-[200px]">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-blue-500 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-brand-primary/10 flex-shrink-0">
                                {emp.name?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-brand-text truncate group-hover:text-brand-primary transition-colors text-base">{emp.name}</h3>
                                <p className="text-[11px] text-brand-muted font-bold uppercase tracking-wider mt-0.5">
                                    {emp.role || 'Staff'} · {emp.department}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-row gap-4 lg:flex-1">
                            <div className="flex items-center gap-3 text-brand-muted text-[13px] font-medium min-w-[180px]">
                                <Mail className="w-4 h-4 text-brand-primary/70" />
                                <span className="truncate">{emp.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-brand-muted text-[13px] font-medium min-w-[120px]">
                                <Phone className="w-4 h-4 text-brand-primary/70" />
                                <span>{emp.phone || '—'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 lg:w-1/4">
                            <div className="hidden sm:block">
                                <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-50 mb-1">Status</p>
                                <Badge status={emp.status || 'Active'} />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-50 mb-1">Joined</p>
                                <p className="text-[13px] text-brand-text font-bold">{emp.joiningDate || '—'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:ml-auto">
                            <button
                                onClick={(e) => { e.stopPropagation(); setProfile(emp); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xl text-xs font-bold hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                            >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                                onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    if(window.confirm('Delete ' + emp.name + '?')) {
                                        await api.delete('/api/employees/' + (emp.employeeId || emp.id));
                                        _onRefresh();
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {profile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProfile(null)}>
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 md:p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
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

// ─── Section content renderer ────────────────────────────────────────────────
const SectionContent = ({ section, employees, onRefresh, onOnboard }: { section: string; employees: any[]; onRefresh: () => void; onOnboard: () => void }) => {
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
                    <StatCard title="Total Headcount" value={employees.length || hrStats.headcount} icon={Users} color="bg-brand-primary" delay={0.1} />
                    <StatCard title="Open Positions" value={hrStats.openRoles} icon={Briefcase} color="bg-violet-500" delay={0.2} />
                    <StatCard title="On Leave Today" value={hrStats.onLeaveToday} icon={UserX} color="bg-rose-500" delay={0.3} />
                    <StatCard title="New Hires (MTD)" value={hrStats.newHiresMTD} icon={UserCheck} color="bg-emerald-500" delay={0.4} />
                </div>

                {/* Content row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
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
                                <button 
                                    onClick={onOnboard}
                                    className="w-full bg-brand-primary text-white hover:bg-white hover:text-brand-primary px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all border-b-4 border-brand-primary/20 hover:border-brand-bg"
                                >
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

    if (section === 'team') {
        return <div className="p-8"><EmployeesSection employees={employees} onRefresh={onRefresh} /></div>;
    }

    if (section === 'tasks') {
        return (
            <div className="p-8 space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-brand-text uppercase tracking-tight">Assign Task</h2>
                        <p className="text-sm text-brand-muted">Directly delegate work to specific employees.</p>
                    </div>
                </div>
                <form className="space-y-6" onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    try {
                        await api.post('/api/tasks', Object.fromEntries(formData.entries()));
                        alert('Task assigned successfully!');
                        (e.target as HTMLFormElement).reset();
                    } catch (err: any) { alert(err.message); }
                }}>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Assignee</label>
                            <select name="employeeId" required className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none">
                                <option value="">Select Employee</option>
                                {employees.map(e => <option key={e.employeeId} value={e.employeeId}>{e.name} ({e.department})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Task Title</label>
                            <input name="title" required placeholder="e.g. Q4 Performance Reviews" className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Description</label>
                            <textarea name="description" rows={4} required placeholder="Detail the task requirements..." className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Priority</label>
                                <select name="priority" className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none">
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Deadline</label>
                                <input name="deadline" type="date" required className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-brand-primary/20">
                        Create Task
                    </button>
                </form>
            </div>
        );
    }

    if (section === 'attendance') {
        return (
            <div className="p-8 space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-brand-text uppercase tracking-tight">Attendance Logs</h2>
                        <p className="text-sm text-brand-muted">Overview of today's workforce presence.</p>
                    </div>
                </div>
                {/* Visual placeholder for metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
                        <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mb-1">On Time</p>
                        <p className="text-2xl font-black text-emerald-500">82%</p>
                    </div>
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
                        <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mb-1">Late Arrivals</p>
                        <p className="text-2xl font-black text-amber-500">12%</p>
                    </div>
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
                        <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mb-1">Absentees</p>
                        <p className="text-2xl font-black text-rose-500">6%</p>
                    </div>
                </div>
                <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                    <p className="px-6 py-8 text-center text-brand-muted text-sm italic">Detailed logs coming soon — Attendance is tracked in the Overview page.</p>
                </div>
            </div>
        );
    }

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
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/employees');
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="h-dvh bg-brand-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-dvh bg-brand-bg text-brand-text flex overflow-hidden font-sans relative">
            {/* Mobile backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside className={cn(
                'fixed inset-y-0 left-0 w-72 border-r border-brand-border bg-brand-surface flex flex-col p-6 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-dvh lg:flex',
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
                            <span className="text-base font-bold text-brand-text tracking-tight block">Forge India Connect</span>
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
                <header className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4 border-b border-brand-border bg-brand-surface sticky top-0 z-30">
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
                    <SectionContent 
                        section={activeSection} 
                        employees={employees} 
                        onRefresh={fetchData} 
                        onOnboard={() => setActiveSection('team')}
                    />
                </main>
            </div>
        </div>
    );
};

export default HRDashboard;
