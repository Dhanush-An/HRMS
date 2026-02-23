import { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    CheckCircle,
    Clock,
    XCircle,
    Filter,
    Users,
    ChevronRight,
    Search,
    Plus
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../api';

interface LeaveRequest {
    id: string;
    employeeId: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    appliedOn: string;
}

interface Employee {
    id: string;
    name: string;
    department: string;
    leaveBalance?: {
        sick: number;
        casual: number;
        paid: number;
        wfh: number;
    };
}

const Leaves = () => {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showApplyModal, setShowApplyModal] = useState(false);

    const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'balances'>(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role?.toLowerCase().includes('admin')) return 'requests';
        }
        return 'dashboard';
    });

    // Filter State
    const [statusFilter, setStatusFilter] = useState('All');

    // New Leave Form
    const [formData, setFormData] = useState({
        employeeId: '',
        type: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const [user] = useState<any>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const isAdmin = user?.role?.toLowerCase().includes('admin');

    useEffect(() => {
        if (user) {
            // Pre-fill for non-admin
            if (!isAdmin) {
                setFormData((prev: any) => ({ ...prev, employeeId: user.id }));
            }
        }
        fetchData();
    }, [user, isAdmin]);

    const fetchData = async () => {
        try {
            const [leavesRes, empRes] = await Promise.all([
                api.get('/api/leaves'),
                api.get('/api/employees')
            ]);

            setLeaves(await leavesRes.json());
            setEmployees(await empRes.json());
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();

        // If user is employee, ensure ID is theirs
        const isUserAdmin = user?.role?.toLowerCase().includes('admin');
        const targetEmployeeId = !isUserAdmin ? user.id : formData.employeeId;

        const emp = employees.find(e => e.id === targetEmployeeId);
        if (!emp) return;

        try {
            const response = await api.post('/api/leaves', {
                ...formData,
                employeeId: targetEmployeeId,
                name: emp.name
            });

            if (response.ok) {
                setShowApplyModal(false);
                fetchData();
                // Reset form but keep ID for employees
                setFormData({
                    employeeId: !isAdmin ? user.id : '',
                    type: 'Sick Leave',
                    startDate: '',
                    endDate: '',
                    reason: ''
                });
                // Removed localhost notification
            }
        } catch (error) {
            console.error("Error applying for leave:", error);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
        try {
            const response = await api.put(`/api/leaves/${id}`, { status });

            if (response.ok) {
                fetchData();
            } else {
                // Removed localhost notification
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // Filter leaves based on user role
    const visibleLeaves = isAdmin
        ? (Array.isArray(leaves) ? leaves : [])
        : (Array.isArray(leaves) ? leaves.filter((l: LeaveRequest) => l.employeeId === user?.id) : []);

    // Derived Data
    const pendingRequests = Array.isArray(visibleLeaves) ? visibleLeaves.filter((l: LeaveRequest) => l.status === 'Pending').length : 0;
    const approvedToday = Array.isArray(visibleLeaves) ? visibleLeaves.filter((l: LeaveRequest) => l.status === 'Approved' &&
        new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length : 0;

    const filteredLeaves = statusFilter === 'All'
        ? visibleLeaves
        : (Array.isArray(visibleLeaves) ? visibleLeaves.filter((l: LeaveRequest) => l.status === statusFilter) : []);

    const visibleEmployees = isAdmin
        ? (Array.isArray(employees) ? employees : [])
        : (Array.isArray(employees) ? employees.filter((e: Employee) => e.id === user?.id) : []);

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Leave Management</h1>
                    <p className="text-brand-muted font-medium">Coordinate time off, monitor presence, and manage balances.</p>
                </div>
                {!isAdmin && (
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowApplyModal(true)}
                            className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-brand-primary/20 text-xs uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4" />
                            Request Leave
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-brand-primary/10 rounded-xl group-hover:bg-brand-primary/20 transition-colors">
                            <Clock className="w-5 h-5 text-brand-primary" />
                        </div>
                        {isAdmin && <span className="text-status-approved text-[10px] font-black uppercase tracking-widest bg-status-approved/10 px-2 py-0.5 rounded-full border border-status-approved/20">Active</span>}
                    </div>
                    <div className="text-3xl font-black text-brand-text mb-1">{pendingRequests}</div>
                    <p className="text-brand-muted font-bold uppercase text-[10px] tracking-widest">Pending Requests</p>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-brand-primary/10 rounded-xl group-hover:bg-brand-primary/20 transition-colors">
                            <Users className="w-5 h-5 text-brand-primary" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-brand-text mb-1">{approvedToday}</div>
                    <p className="text-brand-muted font-bold uppercase text-[10px] tracking-widest">On Leave Today</p>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-brand-primary/10 rounded-xl group-hover:bg-brand-primary/20 transition-colors">
                            <CalendarIcon className="w-5 h-5 text-brand-primary" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-brand-text mb-1 uppercase text-sm tracking-tighter">
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                    <p className="text-brand-muted font-bold uppercase text-[10px] tracking-widest">Current Period</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-100">
                {!isAdmin && (
                    <div className="border-b border-brand-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-table-header">
                        <div className="flex bg-brand-bg p-1 rounded-xl border border-brand-border shadow-sm">
                            {['dashboard', 'requests', 'balances'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                        activeTab === tab
                                            ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg"
                                    )}
                                >
                                    {tab === 'dashboard' ? 'Overview' : tab === 'requests' ? 'Requests' : 'Balances'}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 pl-10 pr-4 text-brand-text placeholder-brand-muted text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                )}

                <div className="p-8 space-y-12">
                    {(isAdmin || activeTab === 'requests') && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            {isAdmin && (
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-brand-text uppercase tracking-tight">Recent Leave Requests</h2>
                                        <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1">Review and manage pending employee applications.</p>
                                    </div>
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or reason..."
                                            className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-brand-text placeholder-brand-muted text-xs font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            )}
                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest mr-2 flex items-center gap-2">
                                    <Filter className="w-3.5 h-3.5" />
                                    Filter Status:
                                </span>
                                {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-90 ${statusFilter === status
                                            ? 'bg-brand-text text-brand-surface border-brand-text shadow-md'
                                            : 'bg-brand-bg text-brand-muted border-brand-border hover:border-brand-primary hover:text-brand-primary'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-brand-border shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-brand-bg/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Employee</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Category</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Timeline</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Justification</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Status</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border">
                                        {Array.isArray(filteredLeaves) && filteredLeaves.map((leave) => (
                                            <tr key={leave.id} className="hover:bg-brand-bg/30 transition-colors group">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="text-brand-text font-black text-sm">{leave.name}</div>
                                                    <div className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1 italic">Applied: {leave.appliedOn}</div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${leave.type === 'Sick Leave' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                                        leave.type === 'Casual Leave' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                                                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                        }`}>
                                                        {leave.type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-brand-text font-black text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-3.5 h-3.5 text-brand-muted" />
                                                        {leave.startDate} <ChevronRight className="w-3 h-3 text-brand-muted opacity-50" /> {leave.endDate}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-brand-muted font-medium text-xs max-w-xs truncate italic" title={leave.reason}>
                                                    "{leave.reason}"
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-2xl border ${leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                        leave.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                        }`}>
                                                        <span className={`w-2 h-2 rounded-full animate-pulse ${leave.status === 'Approved' ? 'bg-emerald-500' :
                                                            leave.status === 'Rejected' ? 'bg-rose-500' :
                                                                'bg-amber-500'
                                                            }`}></span>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    {isAdmin && leave.status === 'Pending' && (
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                                                                className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                                                                className="w-10 h-10 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {(isAdmin || activeTab === 'balances') && (
                        <div className={cn("animate-in fade-in slide-in-from-right-4 duration-300", isAdmin && "mt-12 pt-12 border-t border-brand-border border-dashed")}>
                            {isAdmin && (
                                <div className="mb-6">
                                    <h2 className="text-xl font-black text-brand-text uppercase tracking-tight">Employee Leave Balances</h2>
                                    <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1">Summary of remaining leave entitlements across the organization.</p>
                                </div>
                            )}
                            <table className="w-full">
                                <thead className="bg-brand-bg/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Employee</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Medical</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Personal</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Privilege</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Remote (WFH)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border">
                                    {Array.isArray(visibleEmployees) && visibleEmployees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-brand-bg/30 transition-colors">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-brand-text font-black text-sm">{emp.name}</div>
                                                <div className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1 italic">{emp.department}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="bg-rose-500/10 text-rose-600 px-4 py-1.5 rounded-xl font-black text-sm">{emp.leaveBalance?.sick || 12}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="bg-indigo-500/10 text-indigo-600 px-4 py-1.5 rounded-xl font-black text-sm">{emp.leaveBalance?.casual || 12}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-xl font-black text-sm">{emp.leaveBalance?.paid || 15}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="bg-amber-500/10 text-amber-600 px-4 py-1.5 rounded-xl font-black text-sm">{emp.leaveBalance?.wfh || 10}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Apply Leave Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-xl p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative group/modal">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text tracking-tighter uppercase">Request Leave</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em]">Professional Time-Off Application</p>
                            </div>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-brand-primary transition-all active:scale-90"
                                title="Dismiss"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleApplyLeave} className="p-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Assign Employee</label>
                                    {isAdmin ? (
                                        <select
                                            className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-black text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner cursor-pointer"
                                            value={formData.employeeId}
                                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Target Employee</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-muted font-bold text-sm italic shadow-inner">
                                            {user?.name}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Type of Leave</label>
                                    <select
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-black text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner cursor-pointer"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="Sick Leave">Sick Leave (Medical)</option>
                                        <option value="Casual Leave">Casual Leave (Personal)</option>
                                        <option value="Paid Leave">Paid Leave (Vacation)</option>
                                        <option value="Work From Home">Work From Home (Remote)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Commencement Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-black text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Conclusion Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-black text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Detailed Reason</label>
                                <textarea
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-medium text-sm placeholder-brand-muted focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner italic min-h-[100px] resize-none"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                    placeholder="Please provide a valid justification for this request..."
                                ></textarea>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyModal(false)}
                                    className="flex-1 bg-brand-bg text-brand-muted p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-brand-border hover:bg-brand-surface hover:text-brand-text transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-brand-primary text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/30 border-t border-white/20 uppercase tracking-[0.2em] text-[10px]"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaves;
