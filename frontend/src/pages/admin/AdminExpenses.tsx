import { useState, useEffect } from 'react';
import { 
    CheckCircle, XCircle, FileText, 
    Trash2, DollarSign, Clock, Search, Filter, 
    CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../api';
import { API_URL } from '../../config';

interface ExpenseClaim {
    _id: string;
    employeeId: string;
    employeeName: string;
    employeeRole: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    receiptName?: string;
    receiptUrl?: string;
    createdAt?: string;
}

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/api/expenses');
            const data = await res.json();
            setExpenses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
        try {
            const response = await api.put(`/api/expenses/${id}/status`, { status });
            if (response.ok) {
                await fetchExpenses();
            } else {
                const err = await response.json();
                alert(`Failed to update status: ${err.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this expense claim?")) {
            try {
                const response = await api.delete(`/api/expenses/${id}`);
                if (response.ok) {
                    await fetchExpenses();
                } else {
                    const err = await response.json();
                    alert(`Failed to delete claim: ${err.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error("Error deleting expense:", error);
            }
        }
    };

    // Derived statistics
    const totalClaimed = expenses.reduce((acc, e) => acc + e.amount, 0);
    const approvedAmount = expenses.filter(e => e.status === 'Approved').reduce((acc, e) => acc + e.amount, 0);
    const pendingAmount = expenses.filter(e => e.status === 'Pending').reduce((acc, e) => acc + e.amount, 0);

    // Filtering logic
    const filteredExpenses = expenses
        .filter((e) => statusFilter === 'All' || e.status === statusFilter)
        .filter((e) => {
            const name = e.employeeName || '';
            const desc = e.description || '';
            const cat = e.category || '';
            const query = searchQuery.toLowerCase();
            return name.toLowerCase().includes(query) ||
                   desc.toLowerCase().includes(query) ||
                   cat.toLowerCase().includes(query);
        });

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight uppercase">Expense Management</h1>
                    <p className="text-brand-muted font-medium text-sm md:text-base leading-relaxed">Review, verify, and approve employee and HR reimbursement claims.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <p className="text-4xl font-black text-brand-text tracking-tighter">₹{totalClaimed.toLocaleString()}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80">Total Expense Filed</p>
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

            {/* Filters and Search */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest mr-2 flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5" />
                            Filter Status:
                        </span>
                        {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-90",
                                    statusFilter === status
                                        ? 'bg-brand-text text-brand-surface border-brand-text shadow-md'
                                        : 'bg-brand-bg text-brand-muted border-brand-border hover:border-brand-primary hover:text-brand-primary'
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                        <input
                            type="text"
                            placeholder="Search by employee, category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 pl-10 pr-4 text-brand-text placeholder-brand-muted text-xs font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Table - Desktop View */}
                <div className="hidden lg:block bg-brand-surface border border-brand-border rounded-2xl overflow-x-auto no-scrollbar shadow-inner">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-table-header border-b border-brand-border text-[11px] font-black uppercase text-brand-muted tracking-widest">
                                <th className="px-6 py-5">Employee</th>
                                <th className="px-6 py-5">Category</th>
                                <th className="px-6 py-5">Amount</th>
                                <th className="px-6 py-5">Description</th>
                                <th className="px-6 py-5">Receipt</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {filteredExpenses.map((expense) => (
                                <tr key={expense._id} className="hover:bg-brand-bg/30 transition-colors group">
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <div className="text-brand-text font-black text-sm">{expense.employeeName}</div>
                                        <div className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1 italic">
                                            Role: {expense.employeeRole} · Date: {expense.date}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <span className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap text-brand-text font-black text-sm">
                                        ₹{expense.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-6 text-brand-muted font-medium text-xs max-w-[200px] truncate italic" title={expense.description}>
                                        "{expense.description}"
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        {expense.receiptName && expense.receiptUrl ? (
                                            <a 
                                                href={`${API_URL}${expense.receiptUrl}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg text-brand-muted hover:text-brand-primary border border-brand-border rounded-xl text-[10px] font-bold transition-all hover:scale-105"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[100px]">{expense.receiptName}</span>
                                            </a>
                                        ) : (
                                            <span className="text-[10px] text-brand-muted italic opacity-50">No receipt</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <span className={cn(
                                            "flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl border w-fit",
                                            expense.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                            expense.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                            'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse'
                                        )}>
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                                expense.status === 'Approved' ? 'bg-emerald-500' :
                                                expense.status === 'Rejected' ? 'bg-rose-500' :
                                                'bg-amber-500'
                                            )} />
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            {expense.status === 'Pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(expense._id, 'Approved')}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(expense._id, 'Rejected')}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-rose-500/20"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleDelete(expense._id)}
                                                    className="bg-brand-bg text-brand-muted hover:bg-rose-500 hover:text-white p-2.5 rounded-xl border border-brand-border hover:border-rose-500 transition-all active:scale-95"
                                                    title="Delete Claim Log"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-brand-muted text-sm italic">
                                        No expense claims found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View - Cards list */}
                <div className="lg:hidden space-y-4">
                    {filteredExpenses.map((expense) => (
                        <div key={expense._id} className="bg-brand-bg border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-brand-text font-black text-sm">{expense.employeeName}</div>
                                    <div className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                        {expense.employeeRole} · {expense.date}
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    expense.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                    expense.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                    'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                )}>
                                    {expense.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-3 border-y border-brand-border border-dashed text-xs">
                                <div>
                                    <span className="text-[10px] text-brand-muted uppercase font-black tracking-widest block mb-0.5">Category</span>
                                    <span className="text-brand-text font-bold">{expense.category}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-brand-muted uppercase font-black tracking-widest block mb-0.5">Amount</span>
                                    <span className="text-brand-text font-black">₹{expense.amount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] text-brand-muted uppercase font-black tracking-widest block mb-1">Description</span>
                                <p className="text-brand-muted text-xs italic font-medium">"{expense.description}"</p>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                {expense.receiptName && expense.receiptUrl ? (
                                    <a 
                                        href={`${API_URL}${expense.receiptUrl}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface text-brand-muted hover:text-brand-primary border border-brand-border rounded-xl text-[10px] font-bold transition-all"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[120px]">{expense.receiptName}</span>
                                    </a>
                                ) : (
                                    <span className="text-[10px] text-brand-muted italic opacity-50">No receipt</span>
                                )}

                                <div className="flex gap-2">
                                    {expense.status === 'Pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(expense._id, 'Approved')}
                                                className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(expense._id, 'Rejected')}
                                                className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
                                                title="Reject"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleDelete(expense._id)}
                                            className="p-2 bg-brand-surface text-brand-muted hover:bg-rose-500 hover:text-white rounded-xl border border-brand-border transition-colors"
                                            title="Delete Claim Log"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredExpenses.length === 0 && (
                        <div className="bg-brand-surface border border-brand-border rounded-2xl py-10 text-center text-brand-muted text-sm italic">
                            No expense claims found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminExpenses;
