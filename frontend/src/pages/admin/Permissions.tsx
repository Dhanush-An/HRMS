import { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    Search,
    Plus,
    User,
    CalendarDays
} from 'lucide-react';
import api from '../../api';

interface PermissionRequest {
    _id: string;
    id?: string; // fallback
    employeeId: string;
    employeeName: string;
    branchId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Declined';
    createdAt: string;
}

interface Employee {
    id: string;
    name: string;
    department: string;
    branchId: string;
}

const Permissions = () => {
    const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Filter State
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [user] = useState<any>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const isAdmin = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase() === 'subadmin' || user?.role?.toLowerCase() === 'hr';

    // New Permission Form
    const [formData, setFormData] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        reason: ''
    });

    const fetchData = async () => {
        try {
            let permUrl = '/api/permissions';
            if (user?.role === 'employee' || user?.role === 'staff') {
                permUrl = `/api/permissions/employee/${user.id}`;
            } else if (user?.role !== 'admin' && user?.branchId) {
                permUrl = `/api/permissions/branch/${user.branchId}`;
            }

            const [permRes, empRes] = await Promise.all([
                api.get(permUrl),
                api.get('/api/employees')
            ]);

            if (permRes.ok) {
                const data = await permRes.json();
                setPermissions(data);
            }
            if (empRes.ok) {
                setEmployees(await empRes.json());
            }
        } catch (error) {
            console.error("Error fetching permissions data:", error);
        }
    };

    useEffect(() => {
        if (user && !isAdmin) {
            setFormData((prev: any) => ({ ...prev, employeeId: user.id }));
        }
        fetchData();
    }, [user, isAdmin]);

    const handleApplyPermission = async (e: React.FormEvent) => {
        e.preventDefault();

        const targetEmployeeId = !isAdmin ? user.id : formData.employeeId;
        let emp = employees.find(e => e.id === targetEmployeeId);
        
        if (!emp && !isAdmin) {
            // fallback if employees not loaded but requesting for self
            emp = { id: user.id, name: user.name, branchId: user.branchId || 'BR001', department: user.department };
        } else if (!emp) {
            alert("Error: Employee records not loaded or invalid selection.");
            return;
        }

        try {
            const payload = {
                ...formData,
                employeeId: targetEmployeeId,
                employeeName: emp.name,
                branchId: emp.branchId || user.branchId || 'BR001'
            };

            const response = await api.post('/api/permissions', payload);

            if (response.ok) {
                setShowApplyModal(false);
                fetchData();
                setFormData({
                    employeeId: !isAdmin ? user.id : '',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '10:00',
                    endTime: '11:00',
                    reason: ''
                });
            } else {
                const err = await response.json();
                alert(`Failed to submit request: ${err.message}`);
            }
        } catch (error: any) {
            console.error("Error applying for permission:", error);
            alert(`Failed to submit request: ${error.message}`);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Declined') => {
        try {
            const response = await api.put(`/api/permissions/${id}/status`, { 
                status, 
                approvedBy: user?.name || user?.role 
            });

            if (response.ok) {
                fetchData();
            } else {
                const err = await response.json();
                alert(`Error updating status: ${err.message}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const pendingRequests = Array.isArray(permissions) ? permissions.filter(p => p.status === 'Pending').length : 0;
    const approvedRequests = Array.isArray(permissions) ? permissions.filter(p => p.status === 'Approved').length : 0;
    const declinedRequests = Array.isArray(permissions) ? permissions.filter(p => p.status === 'Declined').length : 0;

    const filteredPermissions = (statusFilter === 'All'
        ? permissions
        : (Array.isArray(permissions) ? permissions.filter(p => p.status === statusFilter) : [])
    ).filter(p => {
        const empName = p.employeeName || '';
        const reqReason = p.reason || '';
        return empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reqReason.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight">Permissions</h1>
                    <p className="text-brand-muted font-medium text-sm md:text-base leading-relaxed">Manage short time-off and late arrivals requests.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowApplyModal(true)}
                        className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-brand-primary/20 text-xs uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" />
                        Request Permission
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-brand-text mb-1">{pendingRequests}</div>
                    <p className="text-brand-muted font-bold uppercase text-[10px] tracking-widest">Pending Requests</p>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-brand-text mb-1">{approvedRequests}</div>
                    <p className="text-brand-muted font-bold uppercase text-[10px] tracking-widest">Approved Requests</p>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                            <XCircle className="w-5 h-5 text-rose-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-brand-text mb-1">{declinedRequests}</div>
                    <p className="text-brand-muted font-bold uppercase text-[10px] tracking-widest">Declined Requests</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="p-8 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest mr-2 flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5" />
                                Filter Status:
                            </span>
                            {['All', 'Pending', 'Approved', 'Declined'].map(status => (
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
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                            <input
                                type="text"
                                placeholder="Search by name or reason..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-brand-text placeholder-brand-muted text-xs font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-table-header border-b border-brand-border text-[11px] font-black uppercase text-brand-muted tracking-widest">
                                    <th className="px-4 py-5">Employee</th>
                                    <th className="px-4 py-5">Date & Time</th>
                                    <th className="px-4 py-5">Reason</th>
                                    <th className="px-4 py-5">Status</th>
                                    {isAdmin && <th className="px-4 py-5 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {Array.isArray(filteredPermissions) && filteredPermissions.length > 0 ? filteredPermissions.map((permission) => (
                                    <tr key={permission._id || permission.id} className="hover:bg-brand-bg/30 transition-colors group">
                                        <td className="px-4 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-brand-text">{permission.employeeName}</div>
                                                    <div className="text-xs text-brand-muted mt-0.5">{permission.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-brand-text font-semibold">
                                                <CalendarDays className="w-4 h-4 text-brand-muted" />
                                                {new Date(permission.date).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-brand-muted mt-1 ml-6 font-mono">
                                                {permission.startTime} - {permission.endTime}
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <p className="text-sm text-brand-text line-clamp-2 italic">"{permission.reason}"</p>
                                        </td>
                                        <td className="px-4 py-6 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border ${
                                                permission.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                permission.status === 'Declined' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            }`}>
                                                {permission.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                                                {permission.status === 'Declined' && <XCircle className="w-3 h-3" />}
                                                {permission.status === 'Pending' && <Clock className="w-3 h-3" />}
                                                {permission.status}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-6 whitespace-nowrap text-right">
                                                {permission.status === 'Pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(permission._id || permission.id!, 'Approved')}
                                                            className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-600 active:scale-95 shadow-lg shadow-emerald-500/20"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(permission._id || permission.id!, 'Declined')}
                                                            className="flex items-center gap-2 px-3 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-600 active:scale-95 shadow-lg shadow-rose-500/20"
                                                            title="Decline"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Decline
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-brand-muted text-sm font-medium">
                                            No permission requests found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Apply Permission Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-xl p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative group/modal">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text tracking-tighter uppercase">Request Permission</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em]">Short Time-Off / Late Arrival</p>
                            </div>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-brand-primary transition-all active:scale-90"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleApplyPermission} className="space-y-6">
                            {isAdmin && (
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Assign Employee</label>
                                    <select
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-black text-sm outline-none"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                        required
                                    >
                                        <option value="" className="bg-brand-surface text-brand-text">Select Target Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id} className="bg-brand-surface text-brand-text">{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-black text-sm outline-none"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-black text-sm outline-none"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">End Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-black text-sm outline-none"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Reason</label>
                                <textarea
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-medium text-sm outline-none resize-none min-h-[100px]"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                    placeholder="Brief reason for permission..."
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyModal(false)}
                                    className="flex-1 bg-brand-bg text-brand-muted p-4 rounded-2xl font-black uppercase text-[10px] border border-brand-border"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-brand-primary text-white p-4 rounded-2xl font-black uppercase text-[10px]"
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

export default Permissions;
