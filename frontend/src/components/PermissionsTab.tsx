import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, Search, User, CalendarDays } from 'lucide-react';
import api from '../api';

interface Permission {
    _id: string;
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

interface PermissionsTabProps {
    permissions: Permission[];
    onRefresh: () => void;
    userRole: string;
}

const PermissionsTab: React.FC<PermissionsTabProps> = ({ permissions, onRefresh, userRole }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Sort permissions: Pending first, then by date descending
    const sortedPermissions = [...permissions].sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const filteredPermissions = sortedPermissions.filter(p => {
        const matchesSearch = p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.reason.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setIsUpdating(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await api.put(`/api/permissions/${id}/status`, { 
                status: newStatus,
                approvedBy: user.name || userRole
            });
            if (res.ok) {
                onRefresh();
            } else {
                const err = await res.json();
                alert(`Failed to update status: ${err.message}`);
            }
        } catch (error) {
            console.error("Error updating permission status", error);
            alert("An error occurred while updating status.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-brand-text tracking-tight">Permissions</h2>
                    <p className="text-sm text-brand-muted mt-1">Review and manage employee permission requests</p>
                </div>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-brand-border bg-brand-bg/50 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or reason..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-brand-surface border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-brand-surface border border-brand-border rounded-xl text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Declined">Declined</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-brand-border text-[10px] font-black uppercase text-brand-muted tracking-[0.2em] bg-table-header">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/50">
                            {filteredPermissions.length > 0 ? (
                                filteredPermissions.map(permission => (
                                    <tr key={permission._id} className="hover:bg-brand-bg/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-brand-text">{permission.employeeName}</div>
                                                    <div className="text-xs text-brand-muted">{permission.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-brand-text">
                                                <CalendarDays className="w-4 h-4 text-brand-muted" />
                                                {new Date(permission.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-brand-muted mt-1 ml-6">
                                                {permission.startTime} - {permission.endTime}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-brand-text line-clamp-2">{permission.reason}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                permission.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                permission.status === 'Declined' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                                {permission.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                                                {permission.status === 'Declined' && <XCircle className="w-3 h-3" />}
                                                {permission.status === 'Pending' && <Clock className="w-3 h-3" />}
                                                {permission.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {permission.status === 'Pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(permission._id, 'Approved')}
                                                        disabled={isUpdating}
                                                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(permission._id, 'Declined')}
                                                        disabled={isUpdating}
                                                        className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50"
                                                        title="Decline"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-brand-muted italic opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Action taken
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-brand-muted">
                                            <CheckCircle2 className="w-8 h-8 mb-3 opacity-20" />
                                            <p className="text-sm">No permission requests found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PermissionsTab;
