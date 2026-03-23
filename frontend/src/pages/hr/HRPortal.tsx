import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Calendar, FileText, Bell,
    LogOut, Menu, X, Building2, DollarSign, Shield,
    Search, Plus, XCircle, CheckCircle, Eye,
    Mail, Phone,
} from 'lucide-react';
import api from '../../api';
import logo from '../../assets/antigraviity logo 2.jpg';

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
    { id: 'employees',    icon: Users,            label: 'Employees' },
    { id: 'attendance',   icon: Calendar,         label: 'Attendance' },
    { id: 'leaves',       icon: FileText,         label: 'Leave Requests' },
    { id: 'payroll',      icon: DollarSign,       label: 'Payroll' },
    { id: 'permissions',  icon: Shield,           label: 'Permissions' },
    { id: 'announcements',icon: Bell,             label: 'Announcements' },
];

// ─── Section: Overview ────────────────────────────────────────────────────────
const Overview = ({ employees, leaves, attendance }: any) => {
    const totalEmp = employees.length;
    const todayStr = new Date().toISOString().split('T')[0];
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

    const filtered = employees.filter(e =>
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
            </div>
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input
                    value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search employees…"
                    className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
                />
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-brand-bg border-b border-brand-border">
                        <tr>{['Employee', 'Department', 'Role', 'Status', ''].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-muted">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {filtered.map((emp: any) => (
                            <tr key={emp._id || emp.id} className="hover:bg-brand-bg/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-bold">{emp.name?.charAt(0)}</div>
                                        <div>
                                            <p className="text-sm font-semibold text-brand-text">{emp.name}</p>
                                            <p className="text-xs text-brand-muted">{emp.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-brand-text">{emp.department}</td>
                                <td className="px-4 py-3 text-sm text-brand-muted">{emp.role}</td>
                                <td className="px-4 py-3"><Badge status={emp.status || 'Active'} /></td>
                                <td className="px-4 py-3">
                                    <button onClick={() => setProfile(emp)} className="p-1.5 hover:bg-brand-primary/10 rounded-lg text-brand-muted hover:text-brand-primary transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!filtered.length && <p className="px-6 py-8 text-center text-brand-muted text-sm">No employees found.</p>}
            </div>

            {/* Profile modal */}
            {profile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProfile(null)}>
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-blue-500 flex items-center justify-center text-white text-xl font-black">{profile.name?.charAt(0)}</div>
                                <div>
                                    <h3 className="font-black text-brand-text text-lg">{profile.name}</h3>
                                    <p className="text-xs text-brand-primary font-semibold">{profile.role} · {profile.department}</p>
                                    <p className="text-xs text-brand-muted">{profile.employeeId || profile.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setProfile(null)} className="text-brand-muted hover:text-brand-text"><XCircle className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-3 text-sm">
                            {[
                                { icon: Mail, label: 'Email', val: profile.email },
                                { icon: Phone, label: 'Phone', val: profile.phone || '—' },
                                { icon: Calendar, label: 'Joined', val: profile.joiningDate },
                                { icon: Building2, label: 'Status', val: profile.status || 'Active' },
                            ].map(({ icon: Icon, label, val }) => (
                                <div key={label} className="flex items-center gap-3 px-3 py-2 bg-brand-bg rounded-xl">
                                    <Icon className="w-4 h-4 text-brand-primary flex-shrink-0" />
                                    <span className="text-brand-muted w-16 flex-shrink-0">{label}</span>
                                    <span className="text-brand-text font-medium">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Section: Attendance ──────────────────────────────────────────────────────
const AttendanceSection = ({ attendance }: any) => {
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
                                <td className="px-4 py-3 text-sm font-medium text-brand-text">{rec.employeeName || rec.name || rec.employeeId}</td>
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
            case 'overview':     return <Overview employees={employees} leaves={leaves} attendance={attendance} />;
            case 'employees':    return <EmployeesSection employees={employees} onRefresh={fetchAll} />;
            case 'attendance':   return <AttendanceSection attendance={attendance} employees={employees} />;
            case 'leaves':       return <LeavesSection leaves={leaves} employees={employees} onRefresh={fetchAll} />;
            case 'payroll':      return <PayrollSection employees={employees} />;
            case 'permissions':  return <PermissionsSection leaves={leaves} onRefresh={fetchAll} />;
            case 'announcements':return <AnnouncementsSection />;
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
                <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                    {NAV.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => { setSection(id); setSidebar(false); }}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium',
                                section === id ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'
                            )}>
                            <Icon className="w-4 h-4 flex-shrink-0" />
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
                            <p className="text-[10px] text-brand-muted uppercase tracking-widest font-semibold">HR</p>
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
