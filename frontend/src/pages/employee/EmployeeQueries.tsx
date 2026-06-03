import { useState, useEffect } from 'react';
import {
    Plus,
    Clock,
    CheckCircle2,
    X,
    MessageCircle,
    Loader2,
    Send
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../api';

interface Query {
    _id: string;
    employeeId: string;
    employeeName: string;
    subject: string;
    message: string;
    status: 'Pending' | 'Resolved' | 'In Progress';
    createdAt: string;
}

const EmployeeQueries = () => {
    const [queries, setQueries] = useState<Query[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        subject: '',
        message: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchMyQueries = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/api/queries?employeeId=${user.id}`);
            const data = await response.json();
            setQueries(data);
        } catch (error) {
            console.error('Error fetching queries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user.id) {
            fetchMyQueries();
        }
    }, [user.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) return;

        setIsSubmitting(true);
        try {
            const response = await api.post('/api/queries', {
                ...formData,
                employeeId: user.id,
                employeeName: user.name
            });

            if (response.ok) {
                setFormData({ subject: '', message: '' });
                setIsModalOpen(false);
                fetchMyQueries();
            }
        } catch (error) {
            console.error('Error submitting query:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Resolved': return "bg-status-approved/10 text-status-approved border-status-approved/20";
            case 'In Progress': return "bg-brand-primary/10 text-brand-primary border-brand-primary/20";
            default: return "bg-status-rejected/10 text-status-rejected border-status-rejected/20";
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight uppercase italic">My Queries</h1>
                    <p className="text-brand-muted font-bold text-sm md:text-base opacity-70">Have a question or concern? Raise it here.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto bg-brand-primary hover:opacity-90 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-brand-primary/30 font-black text-xs uppercase tracking-widest"
                >
                    <Plus className="w-5 h-5" />
                    New Query
                </button>
            </div>

            {/* Queries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full p-20 text-center bg-brand-surface border border-brand-border rounded-3xl">
                        <Loader2 className="animate-spin w-10 h-10 text-brand-primary mx-auto mb-4" />
                        <p className="text-brand-muted font-bold uppercase tracking-widest text-[10px]">Loading your queries...</p>
                    </div>
                ) : queries.length === 0 ? (
                    <div className="col-span-full p-20 text-center bg-brand-surface border border-brand-border rounded-3xl">
                        <div className="w-20 h-20 bg-brand-bg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-border">
                            <MessageCircle className="w-10 h-10 text-brand-muted" />
                        </div>
                        <h3 className="text-brand-text font-black text-xl mb-2 tracking-tight">No Queries Yet</h3>
                        <p className="text-brand-muted text-sm font-medium mb-8 max-w-xs mx-auto">You haven't raised any queries yet. Click the "New Query" button to get started.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-brand-primary font-black text-xs uppercase tracking-widest hover:underline"
                        >
                            Raise your first query →
                        </button>
                    </div>
                ) : (
                    queries.map((query) => (
                        <div key={query._id} className="bg-brand-surface border border-brand-border rounded-[2rem] p-8 flex flex-col hover:shadow-2xl hover:shadow-brand-primary/10 transition-all border-b-4 border-b-brand-primary/20">
                            <div className="flex items-center justify-between mb-6">
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                                    getStatusStyles(query.status)
                                )}>
                                    {query.status}
                                </div>
                                <span className="text-[10px] text-brand-muted font-black uppercase tracking-tighter">
                                    {new Date(query.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <h3 className="text-lg font-black text-brand-text mb-3 leading-tight tracking-tight uppercase italic">{query.subject}</h3>
                            <p className="text-brand-muted font-medium text-sm leading-relaxed flex-1 opacity-80">{query.message}</p>
                            
                            <div className="mt-8 pt-6 border-t border-brand-border border-dashed flex items-center justify-between">
                                <div className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Status Tracking</div>
                                {query.status === 'Resolved' && (
                                    <CheckCircle2 className="w-5 h-5 text-status-approved" />
                                )}
                                {query.status === 'In Progress' && (
                                    <Clock className="w-5 h-5 text-brand-primary animate-pulse" />
                                )}
                                {query.status === 'Pending' && (
                                    <div className="w-2 h-2 rounded-full bg-status-rejected animate-ping" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Query Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4" onClick={() => !isSubmitting && setIsModalOpen(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 md:p-8 border-b border-brand-border bg-gradient-to-br from-brand-primary/5 to-transparent flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text tracking-tighter uppercase italic">Raise a Query</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">Ticketing System</p>
                            </div>
                            <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="p-3 hover:bg-brand-bg rounded-2xl transition-colors text-brand-muted">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-brand-muted tracking-[0.2em] mb-4 ml-1">Subject / Title</label>
                                <input
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Briefly describe your query"
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-5 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all font-bold placeholder:text-brand-muted/30"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase text-brand-muted tracking-[0.2em] mb-4 ml-1">Detailed Message</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Explain your concern in detail..."
                                    rows={5}
                                    className="w-full bg-brand-bg border border-brand-border rounded-3xl p-6 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all font-medium placeholder:text-brand-muted/30 resize-none leading-relaxed"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.subject || !formData.message}
                                className="w-full py-5 bg-brand-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-brand-primary/40 disabled:opacity-50 disabled:scale-100 disabled:shadow-none mt-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Query
                                        <Send className="w-4 h-4 translate-y-[-1px]" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeQueries;
