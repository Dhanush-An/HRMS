import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Calendar, FileText, Bell,
    LogOut, X, DollarSign, Shield,
    Search, Plus, XCircle, CheckCircle,
    Mail, Phone, Edit2, Trash2, UserPlus, ClipboardList, Clock,
} from 'lucide-react';
import api from '../../api';
import logo from '../../assets/antigraviity logo 2.jpg';
import AdminPayroll from '../admin/Payroll';

// ─── helpers ─────────────────────────────────────────────────────────────────
const cn = (...classes: (string | boolean | undefined)[]) =>
    classes.filter(Boolean).join(' ');

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
    { id: 'announcements',icon: Bell,             label: 'Announcements' },
];

// ─── Section: Overview ────────────────────────────────────────────────────────
const Overview = ({ employees, leaves, attendance, onRefresh }: any) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [currentTime, setCurrentTime] = useState(new Date());
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const todayStr = new Date().toISOString().split('T')[0];
    const myRecord = attendance.find((a: any) => a.employeeId === user.id && a.date === todayStr);

    const markAttendance = async () => {
        try {
            if (!myRecord) {
                // Check-in
                await api.post('/api/attendance', {
                    employeeId: user.id,
                    employeeName: user.name,
                    date: todayStr,
                    checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'Present'
                });
            } else if (!myRecord.checkOut) {
                // Check-out
                await api.put(`/api/attendance/${myRecord._id || myRecord.id}`, {
                    ...myRecord,
                    checkOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            }
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
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-brand-text">HR Dashboard Overview</h2>
                <p className="text-brand-muted text-sm mt-1">Real-time snapshot of your workforce.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {cards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-brand-surface border border-brand-border rounded-2xl p-6 hover:border-brand-primary/30 transition-all">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', color)}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-3xl font-black text-brand-text">{value}</p>
                        <p className="text-xs text-brand-muted uppercase tracking-widest font-bold mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Attendance Marking Widget */}
            <div className="bg-gradient-to-br from-brand-primary/10 to-blue-500/5 border border-brand-primary/20 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center shadow-xl">
                        <Clock className="w-8 h-8 text-brand-primary animate-pulse" />
                    </div>
                    <div>
                        <p className="text-4xl font-black text-brand-text tracking-tighter">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mt-1 opacity-70">
                            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-brand-text">Daily Presence</p>
                        <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mt-0.5">
                            {myRecord ? `Checked in at ${myRecord.checkIn}` : 'Not checked in today'}
                        </p>
                    </div>
                    <button 
                        onClick={markAttendance}
                        className={cn(
                            "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all text-white border-b-4",
                            !myRecord ? "bg-brand-primary border-brand-primary/30" : 
                            !myRecord.checkOut ? "bg-rose-500 border-rose-500/30" : "bg-brand-muted border-brand-border cursor-not-allowed opacity-50"
                        )}
                        disabled={!!(myRecord && myRecord.checkOut)}
                    >
                        {!myRecord ? 'Check In Now' : !myRecord.checkOut ? 'Check Out Now' : 'Shift Completed'}
                    </button>
                </div>
            </div>

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
    const today = new Date().toISOString().split('T')[0];

    const todayRecords = attendance.filter((a: any) => a.date === today);
    const presentCount = todayRecords.filter((a: any) => a.status === 'Present').length;
    const absentCount = todayRecords.filter((a: any) => a.status === 'Absent').length;
    const lateCount = todayRecords.filter((a: any) => a.status === 'Late').length;

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-black text-brand-text">Attendance Management</h2>
                <p className="text-sm text-brand-muted mt-0.5">Track daily, weekly and monthly attendance.</p>
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

// ─── Section: Payroll ─────────────────────────────────────────────────────────
const PayrollSection = ({ employees }: { employees: any[] }) => {
    const [q, setQ] = useState('');
    const filtered = employees.filter(e => e.name?.toLowerCase().includes(q.toLowerCase()));

    const total = (e: any) => {
        const s = e.salary || {};
        return (s.base || 0) + (s.hra || 0) + (s.transport || 0) + (s.other || 0);
    };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-black text-brand-text">Payroll Management</h2>
                <p className="text-sm text-brand-muted mt-0.5">View salary details and manage payroll.</p>
            </div>
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search employee…"
                    className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-brand-bg border-b border-brand-border">
                        <tr>{['Employee', 'Basic', 'HRA', 'Transport', 'Other', 'Total CTC'].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-muted">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {filtered.map((emp: any) => {
                            const s = emp.salary || {};
                            return (
                                <tr key={emp._id || emp.id} className="hover:bg-brand-bg/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold text-brand-text">{emp.name}</p>
                                        <p className="text-xs text-brand-muted">{emp.department}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-brand-text">₹{(s.base || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-brand-text">₹{(s.hra || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-brand-text">₹{(s.transport || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-brand-text">₹{(s.other || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className="font-black text-brand-primary text-sm">₹{total(emp).toLocaleString()}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!filtered.length && <p className="px-6 py-8 text-center text-brand-muted text-sm">No employees found.</p>}
            </div>
        </div>
    );
};

// ─── Section: Permissions ─────────────────────────────────────────────────────
const PermissionsSection = ({ leaves, onRefresh }: any) => {
    // Reuse leave requests filtered by 'Permission' type (or short leave)
    const perms = leaves.filter((l: any) =>
        l.type?.toLowerCase().includes('permission') || l.type?.toLowerCase().includes('short'));

    const update = async (id: string, status: 'Approved' | 'Rejected') => {
        try { await api.put(`/api/leaves/${id}`, { status }); onRefresh(); }
        catch (e: any) { alert(e.message); }
    };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-black text-brand-text">Permission Requests</h2>
                <p className="text-sm text-brand-muted mt-0.5">Review short leave and special access requests.</p>
            </div>
            {!perms.length ? (
                <div className="bg-brand-surface border border-brand-border rounded-2xl py-16 text-center">
                    <Shield className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-30" />
                    <p className="text-brand-muted text-sm">No permission requests found.</p>
                    <p className="text-xs text-brand-muted/60 mt-1">Requests with type "Permission" or "Short Leave" will appear here.</p>
                </div>
            ) : (
                <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-brand-bg border-b border-brand-border">
                            <tr>{['Employee', 'Type', 'Duration', 'Reason', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-muted">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {perms.map((l: any) => (
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
                </div>
            )}
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

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-brand-text">Task Management</h2>
                    <p className="text-sm text-brand-muted mt-0.5">Assign and track tasks for employees.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
                    <Plus className="w-4 h-4" /> Assign New Task
                </button>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-brand-bg border-b border-brand-border">
                        <tr>{['Employee', 'Project', 'Activity', 'Priority', 'Status', 'Date'].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-muted">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {tasks.map((t: any) => (
                            <tr key={t._id || t.id} className="hover:bg-brand-bg/40 transition-colors">
                                <td className="px-4 py-3 text-sm font-semibold text-brand-text">
                                    {employees.find(e => e.employeeId === t.employeeId)?.name || t.employeeId}
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
            setEmployees(await empRes.json());
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
            case 'permissions':  return <PermissionsSection leaves={leaves} onRefresh={fetchAll} />;
            case 'announcements':return <AnnouncementsSection />;
            case 'task-assignment':return <TasksSection employees={employees} />;
            default:             return null;
        }
    };

    return (
        <div className="h-screen flex overflow-hidden bg-brand-bg text-brand-text font-sans">
            {/* Mobile overlay */}
            {sidebar && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebar(false)} />}

            {/* Sidebar */}
            <aside className={cn(
                'fixed inset-y-0 left-0 w-64 bg-brand-surface border-r border-brand-border flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen',
                sidebar ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="flex items-center justify-between p-5 border-b border-brand-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-brand-primary flex-shrink-0">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-brand-text">Antigraviity</p>
                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">HR Portal</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebar(false)} className="lg:hidden text-brand-muted hover:text-brand-text"><X className="w-5 h-5" /></button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-2">
                    {NAV.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => { setSection(id); setSidebar(false); }}
                            className={cn(
                                'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-base font-medium',
                                section === id ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'
                            )}>
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* User info + logout */}
                <div className="p-4 border-t border-brand-border">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-brand-bg border border-brand-border">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-blue-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                            {user.name?.charAt(0) || 'H'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-brand-text truncate">{user.name || 'HR Manager'}</p>
                            <p className="text-[10px] text-brand-muted uppercase tracking-widest font-black opacity-60 scale-90 -ml-1 mt-0.5">{user.role || 'HR'}</p>
                        </div>
                        <button onClick={logout} title="Logout" className="p-1.5 hover:bg-rose-500/10 rounded-lg text-brand-muted hover:text-rose-500 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {renderSection()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HRPortal;
