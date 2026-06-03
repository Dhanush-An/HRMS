import { useState, useEffect } from 'react';
import { 
    CheckCircle, XCircle, FileText, Plus, Upload, 
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
    const [expenseTypeFilter, setExpenseTypeFilter] = useState<'All' | 'Employee' | 'Branch'>('All');
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
                await fetchExpenses();
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

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/api/expenses');
            const data = await res.json();
            let expensesList = Array.isArray(data) ? data : [];

            if (user?.role === 'subadmin') {
                const empRes = await api.get('/api/employees');
                const emps = await empRes.json();
                const branchEmpIds = (Array.isArray(emps) ? emps : [])
                    .filter((e: any) => e.branchName === user.branchName)
                    .map((e: any) => e.id || e.employeeId || e._id);
                expensesList = expensesList.filter((exp: any) => branchEmpIds.includes(exp.employeeId));
            }

            setExpenses(expensesList);
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

    
    // Base filtered by Expense Type
    const typeFilteredExpenses = expenses.filter(e => {
        if (expenseTypeFilter === 'All') return true;
        if (expenseTypeFilter === 'Branch') return e.employeeRole === 'subadmin';
        return e.employeeRole !== 'subadmin';
    });

    // Derived statistics from typeFilteredExpenses
    const totalClaimed = typeFilteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const approvedAmount = typeFilteredExpenses.filter(e => e.status === 'Approved').reduce((acc, e) => acc + e.amount, 0);
    const pendingAmount = typeFilteredExpenses.filter(e => e.status === 'Pending').reduce((acc, e) => acc + e.amount, 0);

    // Final filtered list
    const filteredExpenses = typeFilteredExpenses
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight uppercase">Expense Management</h1>
                    <p className="text-brand-muted font-medium text-sm md:text-base leading-relaxed">Review, verify, and approve employee and HR reimbursement claims.</p>
                </div>

                <div className="flex items-center gap-4">
                    {user?.role === 'admin' && (
                        <div className="flex bg-brand-surface border border-brand-border rounded-xl p-1 shadow-sm">
                            {['All', 'Employee', 'Branch'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setExpenseTypeFilter(type as any)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        expenseTypeFilter === type
                                            ? 'bg-brand-primary text-white shadow-md'
                                            : 'text-brand-muted hover:text-brand-primary'
                                    }`}
                                >
                                    {type} Expenses
                                </button>
                            ))}
                        </div>
                    )}
                    {user?.role === 'subadmin' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 border-t border-white/20"
                        >
                            <Plus className="w-4 h-4" /> Add Branch Expense
                        </button>
                    )}
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
        
            {/* Create Claim Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-md p-5 md:p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative group/modal max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">File Branch Expense</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em]">Reimbursement Submission Form</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center text-brand-muted hover:bg-brand-bg hover:text-brand-primary rounded-2xl transition-all active:scale-90">
                                <XCircle className="w-6 h-6" />
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

                            {/* Description */}
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
                                    {submitting ? 'Uploading...' : <><Plus className="w-4 h-4" /> Submit Claim</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


export default AdminExpenses;
