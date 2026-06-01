const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminExpenses.tsx', 'utf8');

// 1. Add imports: Plus, Upload
if (!content.includes('Plus')) {
    content = content.replace(/CheckCircle, XCircle, FileText,/, 'CheckCircle, XCircle, FileText, Plus, Upload,');
}

// 2. Add user state and new state variables
const stateVars = `
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
`;
content = content.replace(/const \[searchQuery, setSearchQuery\] = useState\(''\);/, `const [searchQuery, setSearchQuery] = useState('');${stateVars}`);

// 3. Add handleAddClaim
const handleAddClaimFn = `
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
            formData.append('description', category === 'Other' ? description : \`\${category} Claim\`);
            if (receipt) {
                formData.append('receipt', receipt);
            }

            const response = await fetch(\`\${API_URL}/api/expenses\`, {
                method: 'POST',
                headers: {
                    'Authorization': \`Bearer \${localStorage.getItem('token')}\`
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
                alert(\`Submission failed: \${err.message || 'Unknown error'}\`);
            }
        } catch (error) {
            console.error("Error submitting claim:", error);
            alert("Error submitting claim.");
        } finally {
            setSubmitting(false);
        }
    };
`;
content = content.replace(/const fetchExpenses = async \(\) => \{/, `${handleAddClaimFn}\n    const fetchExpenses = async () => {`);

// 4. Update filtering logic
const filterLogic = `
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
`;
content = content.replace(/\/\/ Derived statistics[\s\S]*?(?=return \()/m, `${filterLogic}\n    `);

// 5. Add Header buttons
const headerButtons = `
                <div className="flex items-center gap-4">
                    {user?.role === 'admin' && (
                        <div className="flex bg-brand-surface border border-brand-border rounded-xl p-1 shadow-sm">
                            {['All', 'Employee', 'Branch'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setExpenseTypeFilter(type as any)}
                                    className={\`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all \${
                                        expenseTypeFilter === type
                                            ? 'bg-brand-primary text-white shadow-md'
                                            : 'text-brand-muted hover:text-brand-primary'
                                    }\`}
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
`;
content = content.replace(/(<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">[\s\S]*?<\/div>)\s*<\/div>/m, `$1\n${headerButtons}\n            </div>`);

// 6. Add Modal to the bottom
const modalHtml = `
            {/* Create Claim Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-md p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative group/modal">
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
`;
content = content.replace(/<\/div>\s*\);\s*\};\s*export default AdminExpenses;/m, `${modalHtml}\n\nexport default AdminExpenses;`);

fs.writeFileSync('src/pages/admin/AdminExpenses.tsx', content);
console.log('Modified AdminExpenses.tsx successfully');
