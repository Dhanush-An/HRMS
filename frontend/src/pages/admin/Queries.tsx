import { useState, useEffect } from 'react';
import {
    Search,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Check
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

const Queries = () => {
    const [queries, setQueries] = useState<Query[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    const fetchQueries = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/queries');
            const data = await response.json();
            setQueries(data);
        } catch (error) {
            console.error('Error fetching queries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const response = await api.put(`/api/queries/${id}`, { status: newStatus });
            if (response.ok) {
                fetchQueries();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this query?')) {
            try {
                await api.delete(`/api/queries/${id}`);
                fetchQueries();
            } catch (error) {
                console.error('Error deleting query:', error);
            }
        }
    };

    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            q.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolved': return <CheckCircle2 className="w-4 h-4 text-status-approved" />;
            case 'In Progress': return <Clock className="w-4 h-4 text-brand-primary" />;
            default: return <AlertCircle className="w-4 h-4 text-status-rejected" />;
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight">Employee Queries</h1>
                    <p className="text-brand-muted font-medium text-sm md:text-base">Respond to and manage employee concerns and questions.</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input
                        type="text"
                        placeholder="Search by employee name, ID or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-2xl py-3 pl-12 pr-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all font-medium placeholder:text-brand-muted/50 text-sm shadow-sm"
                    />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                    {['All', 'Pending', 'In Progress', 'Resolved'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "whitespace-nowrap px-6 py-3 rounded-2xl font-bold text-sm transition-all border shadow-sm",
                                statusFilter === status
                                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20"
                                    : "bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary/50"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Queries List */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="p-20 text-center bg-brand-surface border border-brand-border rounded-3xl">
                        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-brand-muted font-bold">Loading queries...</p>
                    </div>
                ) : filteredQueries.length === 0 ? (
                    <div className="p-20 text-center bg-brand-surface border border-brand-border rounded-3xl">
                        <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-brand-muted" />
                        </div>
                        <h3 className="text-brand-text font-black text-lg mb-1">No queries found</h3>
                        <p className="text-brand-muted text-sm font-medium">There are currently no queries matching your filters.</p>
                    </div>
                ) : (
                    filteredQueries.map((query) => (
                        <div key={query._id} className="group bg-brand-surface border border-brand-border rounded-2xl p-6 hover:shadow-xl hover:shadow-brand-primary/5 transition-all">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                                            getStatusStyles(query.status)
                                        )}>
                                            {getStatusIcon(query.status)}
                                            {query.status}
                                        </div>
                                        <span className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                                            {new Date(query.createdAt).toLocaleDateString()} at {new Date(query.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-brand-text mb-2 tracking-tight">{query.subject}</h3>
                                    <p className="text-brand-muted font-medium text-sm leading-relaxed mb-4">{query.message}</p>
                                    
                                    <div className="flex items-center gap-4 py-2 border-t border-brand-border border-dashed mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center text-brand-primary font-black text-xs uppercase">
                                                {query.employeeName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-brand-text tracking-tight">{query.employeeName}</div>
                                                <div className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{query.employeeId}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 lg:flex-col lg:items-end lg:justify-center border-t lg:border-t-0 lg:border-l border-brand-border pt-4 lg:pt-0 lg:pl-6">
                                    <div className="flex-1 lg:flex-none flex items-center gap-2">
                                        {query.status !== 'Resolved' && (
                                            <button
                                                onClick={() => handleStatusUpdate(query._id, 'Resolved')}
                                                className="flex-1 lg:flex-none bg-status-approved/10 text-status-approved hover:bg-status-approved hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Resolve
                                            </button>
                                        )}
                                        {query.status === 'Pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(query._id, 'In Progress')}
                                                className="flex-1 lg:flex-none bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                <Clock className="w-4 h-4" /> In Progress
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(query._id)}
                                            className="p-2.5 text-brand-muted hover:text-status-rejected hover:bg-status-rejected/10 rounded-xl transition-all"
                                            title="Delete Query"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Queries;
