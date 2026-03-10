import { useState, useEffect } from 'react';
import api from '../../api';
import { Star, MessageSquare, Plus } from 'lucide-react';

interface PerformanceRecord {
    id: string;
    employeeId: string;
    type: 'Review' | 'Warning' | 'Promotion';
    title: string;
    description: string;
    rating?: number; // 1-5 for reviews
    date: string;
}

interface Employee {
    id: string;
    name: string;
    department: string;
    role: string;
}

const Performance = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [records, setRecords] = useState<PerformanceRecord[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        type: 'Review',
        title: '',
        description: '',
        rating: 5
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [perfRes, empRes] = await Promise.all([
                api.get('/api/performance'),
                api.get('/api/employees')
            ]);
            setRecords(await perfRes.json());
            setEmployees(await empRes.json());
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleReviewClick = (emp: Employee) => {
        setSelectedEmployee(emp);
        setFormData({ type: 'Review', title: '', description: '', rating: 5 });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        try {
            const response = await api.post('/api/performance', {
                ...formData,
                employeeId: selectedEmployee.id,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            });
            if (response.ok) {
                setShowModal(false);
                fetchData();
                // Removed localhost notification
            }
        } catch (error) {
            console.error("Error submitting:", error);
        }
    };

    // Helper to get latest rating
    const getLatestRating = (empId: string) => {
        const empRecords = Array.isArray(records) ? records.filter(r => r.employeeId === empId && r.type === 'Review') : [];
        if (empRecords.length === 0) return 'N/A';
        return empRecords[empRecords.length - 1].rating + ' / 5';
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Performance Management</h1>
                    <p className="text-brand-muted font-medium">Evaluate employee performance and provide feedback</p>
                </div>
            </div>

            <div className="space-y-4">
                {Array.isArray(employees) && employees.map((emp) => (
                    <div key={emp.id} className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between hover:shadow-lg hover:shadow-brand-primary/5 transition-all group">
                        <div className="flex items-center gap-5 w-full md:w-auto mb-4 md:mb-0">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-blue-400 p-[2px] shadow-lg">
                                <div className="w-full h-full rounded-[14px] bg-brand-surface flex items-center justify-center text-brand-primary font-black text-2xl">
                                    {emp.name.charAt(0)}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-brand-text font-black text-lg">{emp.name}</h3>
                                <p className="text-brand-muted text-xs font-bold uppercase tracking-widest mt-1">{emp.department} • {emp.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 md:gap-12 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-brand-border border-dashed">
                            <div className="text-right">
                                <span className="block text-[10px] text-brand-muted uppercase font-black tracking-[0.2em] mb-1">Last Rating</span>
                                <span className="text-brand-text font-black flex items-center gap-1.5 justify-end">
                                    <span className="text-lg">{getLatestRating(emp.id).split(' ')[0]}</span>
                                    <span className="text-[10px] text-brand-muted">/ 5</span>
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                </span>
                            </div>
                            <div className="text-right border-l border-brand-border border-dashed pl-6 md:pl-8">
                                <span className="block text-[10px] text-brand-muted uppercase font-black tracking-[0.2em] mb-1">Reviews</span>
                                <span className="text-brand-text font-black text-lg">
                                    {Array.isArray(records) ? records.filter(r => r.employeeId === emp.id).length : 0}
                                </span>
                            </div>
                            <button
                                onClick={() => handleReviewClick(emp)}
                                className="bg-brand-primary text-white px-5 md:px-6 py-2.5 md:py-3 rounded-2xl flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-brand-primary/20 text-[10px] md:text-xs font-black uppercase tracking-widest ml-0 md:ml-4"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Review
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-xl font-black text-brand-text uppercase tracking-tight">Post Review</h2>
                                <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1">Evaluating {selectedEmployee.name}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-colors group">
                                <Plus className="w-6 h-6 rotate-45 text-brand-muted group-hover:text-brand-text transition-colors" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Record Type</label>
                                <select
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-black text-xs h-[52px] appearance-none cursor-pointer focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner uppercase tracking-wider"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Review">Performance Review</option>
                                    <option value="Promotion">Promotion</option>
                                    <option value="Warning">Warning</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Review Title</label>
                                <input
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-medium text-sm placeholder-brand-muted focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                    placeholder="e.g. Annual Review 2026"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            {formData.type === 'Review' && (
                                <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border shadow-inner">
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-3 text-center">Final Rating</label>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setFormData({ ...formData, rating: star })}
                                                className={`p-1.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${formData.rating >= star ? 'text-amber-400 drop-shadow-sm' : 'text-brand-muted/30'
                                                    }`}
                                            >
                                                <Star className={`w-8 h-8 ${formData.rating >= star ? 'fill-current' : ''}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Detailed Feedback</label>
                                <textarea
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-medium text-sm placeholder-brand-muted focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner italic min-h-[120px] resize-none"
                                    placeholder="Enter detailed performance feedback..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-brand-bg text-brand-muted p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-brand-border hover:bg-brand-surface hover:text-brand-text transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-brand-primary text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/30 border-t border-white/20 uppercase tracking-[0.2em] text-[10px]"
                                >
                                    Save Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Performance;
