import React, { useState, useEffect } from 'react';
import { LogOut, FileText, CheckCircle2, XCircle, Clock, Save } from 'lucide-react';
import api from '../api';

interface Resignation {
    _id: string;
    employeeId: string;
    employeeName: string;
    employeeRole: string;
    employeeDepartment: string;
    submissionDate: string;
    lastWorkingDate: string;
    noticePeriodDuration: string;
    reason: string;
    comments: string;
    companyAssets: {
        laptop: boolean;
        idCard: boolean;
        simCard: boolean;
        accessCard: boolean;
        otherAssets: boolean;
    };
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}

const statusColors = {
    Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
};

const ResignationTab = ({ role }: { role: 'admin' | 'subadmin' | 'hr' | 'employee' }) => {
    const [viewMode, setViewMode] = useState<'list' | 'my_resign'>('list');
    const [resignations, setResignations] = useState<Resignation[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        lastWorkingDate: '',
        noticePeriodDuration: '',
        reason: '',
        comments: '',
        companyAssets: {
            laptop: false,
            idCard: false,
            simCard: false,
            accessCard: false,
            otherAssets: false
        }
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = async () => {
        setLoading(true);
        try {
            let res;
            if (role === 'admin' || role === 'subadmin' || role === 'hr') {
                res = await api.get('/api/resignations');
            } else {
                res = await api.get(`/api/resignations/${user.employeeId || user.id}`);
            }
            if (res.ok) {
                const data = await res.json();
                setResignations(data);
            }
        } catch (error) {
            console.error("Error fetching resignations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (role === 'employee') {
            setViewMode('my_resign');
        }
    }, [role]);

    const handleAssetChange = (asset: keyof typeof formData.companyAssets) => {
        setFormData(prev => ({
            ...prev,
            companyAssets: {
                ...prev.companyAssets,
                [asset]: !prev.companyAssets[asset]
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                employeeId: user.employeeId || user.id,
                employeeName: user.name,
                employeeRole: user.role,
                employeeDepartment: user.department || 'N/A',
                submissionDate: new Date().toISOString().split('T')[0],
                ...formData
            };

            const res = await api.post('/api/resignations', payload);
            if (res.ok) {
                alert('Resignation submitted successfully.');
                fetchData();
                setViewMode('list');
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to submit resignation.');
            }
        } catch (error) {
            console.error("Error submitting resignation:", error);
            alert('Error submitting resignation.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await api.put(`/api/resignations/${id}`, { status: newStatus });
            if (res.ok) {
                fetchData();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const renderMyResignationForm = () => {
        // Check if user already submitted a resignation
        const myExistingResignation = role === 'employee' 
            ? resignations[0] 
            : resignations.find(r => r.employeeId === (user.employeeId || user.id));

        if (myExistingResignation) {
            return (
                <div className="bg-brand-surface border border-brand-border rounded-[2rem] p-8 max-w-3xl mx-auto shadow-sm">
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${myExistingResignation.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : myExistingResignation.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {myExistingResignation.status === 'Approved' ? <CheckCircle2 className="w-10 h-10" /> : myExistingResignation.status === 'Rejected' ? <XCircle className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
                        </div>
                        <h2 className="text-2xl font-black text-brand-text mb-2">Resignation {myExistingResignation.status}</h2>
                        <p className="text-brand-muted font-medium mb-8">You submitted your resignation on {new Date(myExistingResignation.submissionDate).toLocaleDateString()}</p>
                        
                        <div className="grid grid-cols-2 gap-4 w-full text-left">
                            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Last Working Date</span>
                                <span className="font-bold text-brand-text">{new Date(myExistingResignation.lastWorkingDate).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Notice Period</span>
                                <span className="font-bold text-brand-text">{myExistingResignation.noticePeriodDuration}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-brand-surface border border-brand-border rounded-[2rem] p-8 max-w-3xl mx-auto shadow-sm">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-brand-text tracking-tight mb-2">Submit Resignation</h2>
                    <p className="text-brand-muted font-medium">Please fill out the form below to initiate your resignation process.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2">Resignation Submission Date</label>
                            <input
                                type="date"
                                disabled
                                value={new Date().toISOString().split('T')[0]}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm font-bold opacity-70 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2">Last Working Date *</label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.lastWorkingDate}
                                onChange={e => setFormData({ ...formData, lastWorkingDate: e.target.value })}
                                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-brand-text text-sm transition-all focus:ring-1 focus:ring-brand-primary outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2">Notice Period Duration *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., 30 Days, 2 Months"
                                value={formData.noticePeriodDuration}
                                onChange={e => setFormData({ ...formData, noticePeriodDuration: e.target.value })}
                                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-brand-text text-sm transition-all focus:ring-1 focus:ring-brand-primary outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2">Reason for Resignation *</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Please state your reason for resigning..."
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-brand-text text-sm transition-all focus:ring-1 focus:ring-brand-primary outline-none resize-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2">Detailed Comments (Optional)</label>
                            <textarea
                                rows={2}
                                placeholder="Any additional comments..."
                                value={formData.comments}
                                onChange={e => setFormData({ ...formData, comments: e.target.value })}
                                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-brand-text text-sm transition-all focus:ring-1 focus:ring-brand-primary outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-brand-border">
                        <h3 className="text-sm font-black text-brand-text tracking-tight mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand-primary" />
                            Company Assets Issued
                        </h3>
                        <p className="text-xs text-brand-muted mb-4">Please check the assets that were issued to you. These must be returned before your final settlement.</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { key: 'laptop', label: 'Laptop' },
                                { key: 'idCard', label: 'ID Card' },
                                { key: 'simCard', label: 'SIM Card' },
                                { key: 'accessCard', label: 'Access Card' },
                                { key: 'otherAssets', label: 'Other Assets' },
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-3 p-3 bg-brand-bg border border-brand-border rounded-xl cursor-pointer hover:border-brand-primary/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.companyAssets[key as keyof typeof formData.companyAssets]}
                                        onChange={() => handleAssetChange(key as keyof typeof formData.companyAssets)}
                                        className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-border"
                                    />
                                    <span className="text-sm font-bold text-brand-text">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 mt-6 border-t border-brand-border">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 bg-brand-primary hover:opacity-90 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Resignation'}
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    const renderList = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }

        if (resignations.length === 0) {
            return (
                <div className="text-center py-24 bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm">
                    <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-6">
                        <LogOut className="w-10 h-10 text-brand-muted opacity-30" />
                    </div>
                    <h3 className="text-xl font-black text-brand-text mb-2">No Resignations Found</h3>
                    <p className="text-brand-muted font-medium">There are currently no resignation requests.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {resignations.map(resig => (
                    <div key={resig._id} className="bg-brand-surface border border-brand-border rounded-[2rem] p-6 shadow-sm flex flex-col group hover:border-brand-primary/30 transition-colors">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-blue-500/20 text-brand-primary flex items-center justify-center font-black text-xl">
                                    {resig.employeeName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-brand-text">{resig.employeeName}</h3>
                                    <p className="text-xs font-bold text-brand-muted mt-0.5">{resig.employeeRole} • {resig.employeeDepartment}</p>
                                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mt-1">{resig.employeeId}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl border ${statusColors[resig.status]}`}>
                                {resig.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                            <div className="bg-brand-bg border border-brand-border p-3 rounded-2xl">
                                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Submitted On</span>
                                <span className="text-sm font-bold text-brand-text">{new Date(resig.submissionDate).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-brand-bg border border-brand-border p-3 rounded-2xl">
                                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Last Working Day</span>
                                <span className="text-sm font-bold text-rose-500">{new Date(resig.lastWorkingDate).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-brand-bg border border-brand-border p-3 rounded-2xl col-span-2">
                                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Reason</span>
                                <span className="text-sm text-brand-text line-clamp-2">{resig.reason}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-2">Assets to Return</span>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(resig.companyAssets).map(([key, value]) => {
                                    if (!value) return null;
                                    const labels: any = { laptop: 'Laptop', idCard: 'ID Card', simCard: 'SIM Card', accessCard: 'Access Card', otherAssets: 'Other' };
                                    return (
                                        <span key={key} className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {labels[key]}
                                        </span>
                                    );
                                })}
                                {!Object.values(resig.companyAssets).some(Boolean) && (
                                    <span className="text-xs font-medium text-brand-muted italic">No assets issued</span>
                                )}
                            </div>
                        </div>

                        {/* Actions for Admin/SubAdmin/HR to approve/reject */}
                        {(role === 'admin' || role === 'subadmin' || role === 'hr') && resig.status === 'Pending' && (
                            <div className="flex items-center gap-3 pt-4 border-t border-brand-border mt-auto">
                                <button
                                    onClick={() => handleStatusChange(resig._id, 'Approved')}
                                    className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleStatusChange(resig._id, 'Rejected')}
                                    className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Resignations</h1>
                    <p className="text-brand-muted font-medium mt-1">Manage employee resignations and offboarding.</p>
                </div>

                {role === 'hr' && (
                    <div className="flex bg-brand-surface border border-brand-border p-1 rounded-2xl w-fit">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-brand-primary text-white shadow-md' : 'text-brand-muted hover:text-brand-text'}`}
                        >
                            Employee Resign
                        </button>
                        <button
                            onClick={() => setViewMode('my_resign')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'my_resign' ? 'bg-brand-primary text-white shadow-md' : 'text-brand-muted hover:text-brand-text'}`}
                        >
                            My Resign
                        </button>
                    </div>
                )}
            </div>

            {viewMode === 'list' ? renderList() : renderMyResignationForm()}
        </div>
    );
};

export default ResignationTab;
