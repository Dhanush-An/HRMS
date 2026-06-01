import { useState, useEffect } from 'react';
import { 
    CreditCard, Plus, Upload, X, CheckCircle2, 
    FileText, Trash2, TrendingUp, DollarSign, Clock 
} from 'lucide-react';
import api from '../../api';
import { API_URL } from '../../config';

interface ExpenseClaim {
    _id?: string;
    id: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    receiptName?: string;
    receiptUrl?: string;
}

const EmployeeExpenses = () => {
    const [claims, setClaims] = useState<ExpenseClaim[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [category, setCategory] = useState('Travel Allowance');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [user] = useState<any>(() => {
        const stored = localStorage.getItem('user');
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const fetchClaims = async () => {
        try {
            const res = await api.get('/api/expenses');
            const data = await res.json();
            const filteredData = Array.isArray(data) ? data.filter((c: any) => c.employeeId === user?.id) : [];
            setClaims(filteredData);
        } catch (err) {
            console.error("Error fetching claims:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchClaims();
        }
    }, [user]);

    const handleAddClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        if (category === 'Other' && !description.trim()) {
            alert("Please enter a description for 'Other' expense.");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('employeeId', user.id);
            formData.append('employeeName', user.name);
            formData.append('employeeRole', user.role || 'employee');
            formData.append('category', category);
            formData.append('amount', amount);
            formData.append('date', date);
            formData.append('description', category === 'Other' ? description : `${category} Claim`);
            if (receipt) {
                formData.append('receipt', receipt);
            }

            const response = await fetch(`${API_URL}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                await fetchClaims();
                // Reset form
                setCategory('Travel Allowance');
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                setDescription('');
                setReceipt(null);
                setShowModal(false);
            } else {
                const err = await response.json();
                alert(`Submission failed: ${err.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error submitting claim:", error);
            alert("Error submitting claim.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClaim = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this claim?")) {
            try {
                const res = await api.delete(`/api/expenses/${id}`);
                if (res.ok) {
                    await fetchClaims();
                }
            } catch (error: any) {
                console.error("Error deleting claim:", error);
                alert(error.message || "Failed to delete claim.");
            }
        }
    };

    // Calculate totals
    const totalClaimed = claims.reduce((acc, c) => acc + c.amount, 0);
    const approvedAmount = claims.filter(c => c.status === 'Approved').reduce((acc, c) => acc + c.amount, 0);
    const pendingAmount = claims.filter(c => c.status === 'Pending').reduce((acc, c) => acc + c.amount, 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Expense Claims</h1>
                    <p className="text-brand-muted font-medium italic">Track and file reimbursement requests for official expenditures.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 border-t border-white/20"
                >
                    <Plus className="w-4 h-4" /> Create Claim
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <p className="text-4xl font-black text-brand-text tracking-tighter">₹{totalClaimed.toLocaleString()}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80">Total Claimed</p>
                    </div>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-4xl font-black text-brand-text tracking-tighter">₹{approvedAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80">Approved Claims</p>
                    </div>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <Clock className="w-6 h-6" />
                        </div>
                        <p className="text-4xl font-black text-brand-text tracking-tighter">₹{pendingAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80">Pending Verification</p>
                    </div>
                </div>
            </div>

            {/* Claims Table / List */}
            <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] overflow-hidden shadow-sm shadow-brand-primary/5">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full">
                        <thead className="bg-table-header border-b border-brand-border">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Claim Reference</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Description</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Amount</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {claims.map((claim) => (
                                <tr key={claim._id || claim.id} className="hover:bg-brand-bg/40 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl group-hover:scale-110 transition-transform">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-brand-text font-black text-sm uppercase tracking-tight">{claim.category}</div>
                                                <div className="text-[10px] text-brand-muted font-bold mt-0.5">{claim.date}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-brand-muted font-medium italic max-w-xs truncate">
                                        {claim.description}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-brand-text tracking-tight">
                                        ₹{claim.amount.toLocaleString()}
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <span className={`px-4 py-1 inline-flex text-[9px] leading-5 font-black rounded-full border uppercase tracking-widest ${
                                            claim.status === 'Approved'
                                                ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20'
                                                : claim.status === 'Rejected'
                                                ? 'bg-rose-500/5 text-rose-600 border-rose-500/20'
                                                : 'bg-amber-500/5 text-amber-600 border-amber-500/20 animate-pulse'
                                        }`}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            {claim.receiptName && claim.receiptUrl && (
                                                <a 
                                                    href={`${API_URL}${claim.receiptUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-brand-bg text-brand-muted hover:text-brand-primary border border-brand-border rounded-xl text-[10px] font-bold transition-all hover:scale-105"
                                                    title="View Receipt"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[100px]">{claim.receiptName}</span>
                                                </a>
                                            )}
                                            {claim.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleDeleteClaim(claim._id || claim.id)}
                                                    className="bg-brand-bg text-brand-muted hover:bg-rose-500 hover:text-white p-2.5 rounded-xl border border-brand-border hover:border-rose-500 transition-all active:scale-95"
                                                    title="Cancel Claim"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!claims.length && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center text-brand-muted text-sm italic">
                                        No expense claims recorded. Click "Create Claim" to file one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reimbursement Protocol Notice */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-brand-primary/5 to-blue-500/5 border border-brand-primary/10 flex items-start gap-6 shadow-sm">
                <div className="p-4 bg-brand-surface rounded-2xl border border-brand-primary/20 shadow-sm">
                    <TrendingUp className="w-8 h-8 text-brand-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-brand-text mb-2 uppercase tracking-tight">Reimbursement Policy Node</h3>
                    <p className="text-brand-muted text-sm leading-relaxed max-w-2xl font-medium italic opacity-80">
                        Claims must be submitted within 30 days of the transaction date. Original soft copies of bills/invoices must be attached as receipts. Verified claims are cleared in the subsequent payroll cycle.
                    </p>
                </div>
            </div>

            {/* Create Claim Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-md p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative group/modal">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">File Expense</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em]">Reimbursement Submission Form</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center text-brand-muted hover:bg-brand-bg hover:text-brand-primary rounded-2xl transition-all active:scale-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddClaim} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Expense Category</label>
                                <select 
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                >
                                    <option>Travel Allowance</option>
                                    <option>Client Dinner</option>
                                    <option>Internet Reimbursement</option>
                                    <option>Office Supplies</option>
                                    <option>Training & Seminars</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Amount (INR)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="1"
                                        placeholder="e.g. 1500" 
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 outline-none" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Transaction Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 outline-none" 
                                    />
                                </div>
                            </div>

                            {/* Description - only shown when "Other" is selected */}
                            {category === 'Other' && (
                                <div className="space-y-1.5 animate-in fade-in duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Description / Purpose</label>
                                    <textarea 
                                        rows={3} 
                                        required 
                                        placeholder="Please describe the purpose of this custom expense..." 
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 outline-none resize-none" 
                                    />
                                </div>
                            )}

                            {/* Receipt File Upload */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-1">Receipt Attachment</label>
                                <div className="border border-dashed border-brand-border rounded-xl p-4 text-center hover:border-brand-primary/30 transition-all cursor-pointer relative group bg-brand-bg shadow-inner">
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => setReceipt(e.target.files ? e.target.files[0] : null)}
                                    />
                                    <div className="flex items-center justify-center gap-2 text-brand-muted group-hover:text-brand-primary transition-colors">
                                        <Upload className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-tight">{receipt ? receipt.name : "Choose Invoice/Receipt"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting}
                                    className="flex-1 py-4 bg-brand-bg text-brand-muted rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest border border-brand-border hover:bg-brand-surface transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-4 bg-brand-primary text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/30 border-t border-white/20 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>Uploading...</>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Submit Claim
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeExpenses;
