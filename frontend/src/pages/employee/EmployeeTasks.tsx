import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    Calendar,
    Plus,
    Send,
    Edit2,
    AlertCircle,
    Layout,
    Briefcase,
    Activity,
    X,
    MessageSquare,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface Task {
    id: string;
    employeeId: string;
    description: string;
    projectName?: string;
    date: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
}

const EmployeeTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Get user from local storage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentEmployeeId = user ? user.id : '';

    const [formData, setFormData] = useState({
        employeeId: currentEmployeeId,
        projectName: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        priority: 'Medium',
        status: 'Completed'
    });

    useEffect(() => {
        if (currentEmployeeId) {
            fetchData();
        }
    }, [currentEmployeeId, filterDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/tasks?employeeId=${currentEmployeeId}`);
            const data = await response.json();

            const filteredTasks = Array.isArray(data) ? data.filter((task: Task) =>
                (task.employeeId === currentEmployeeId) &&
                (task.date === filterDate)
            ) : [];

            setTasks(filteredTasks.reverse());
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditTask = (task: Task) => {
        setFormData({
            employeeId: task.employeeId,
            projectName: task.projectName || '',
            description: task.description,
            date: task.date,
            priority: task.priority,
            status: task.status
        });
        setEditingTaskId(task.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleOpenModal = () => {
        setFormData({
            employeeId: currentEmployeeId,
            projectName: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            priority: 'Medium',
            status: 'Completed'
        });
        setIsEditing(false);
        setEditingTaskId(null);
        setShowModal(true);
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentEmployeeId) return;

        try {
            const response = isEditing
                ? await api.put(`/api/tasks/${editingTaskId}`, { ...formData, employeeId: currentEmployeeId })
                : await api.post('/api/tasks', { ...formData, employeeId: currentEmployeeId });

            if (response.ok) {
                setShowModal(false);
                fetchData();
            }
        } catch (error) {
            console.error("Error submitting task:", error);
        }
    };

    if (!user) return (
        <div className="p-12 text-center bg-brand-surface rounded-[2.5rem] border border-brand-border">
            <AlertCircle className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-20" />
            <h3 className="text-brand-text font-black uppercase text-sm mb-2">Authentication Required</h3>
            <p className="text-brand-muted text-xs italic">Please log in to access your daily work ledger.</p>
        </div>
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Daily Reports</h1>
                    <p className="text-brand-muted font-medium">Documenting today's progress for tomorrow's success.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48 group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full bg-brand-surface text-brand-text border border-brand-border rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all font-bold text-xs"
                        />
                    </div>

                    <button
                        onClick={handleOpenModal}
                        className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-brand-primary/20 text-xs uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" />
                        Create Entry
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Reports List */}
                <div className="xl:col-span-3 space-y-4">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 gap-3 bg-brand-surface rounded-2xl border border-brand-border border-dashed">
                            <Activity className="w-6 h-6 text-brand-primary animate-spin" />
                            <p className="text-brand-muted text-[10px] font-black uppercase tracking-widest">Retrieving Records...</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="bg-brand-surface border border-brand-border border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                            <Layout className="w-12 h-12 text-brand-muted opacity-20 mb-4" />
                            <h3 className="text-brand-text font-black uppercase text-xs mb-2">No Entries Recorded</h3>
                            <p className="text-brand-muted text-[11px] font-medium leading-relaxed italic max-w-xs">No updates found for this date. Initialize a new entry to track your progress.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-brand-surface border border-brand-border rounded-2xl p-6 hover:shadow-md transition-all group relative overflow-hidden"
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="space-y-4 w-full">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-brand-bg rounded-lg border border-brand-border">
                                                    <Briefcase className="w-3 h-3 text-brand-primary" />
                                                    <span className="text-[10px] font-black text-brand-text uppercase tracking-widest">{task.projectName || 'Internal'}</span>
                                                </div>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                                    task.status === 'Completed' ? "bg-status-approved/10 border-status-approved/20 text-status-approved" :
                                                        task.status === 'In Progress' ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" :
                                                            "bg-status-pending/10 border-status-pending/20 text-status-pending"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full",
                                                        task.status === 'Completed' ? "bg-status-approved" :
                                                            task.status === 'In Progress' ? "bg-brand-primary animate-pulse" :
                                                                "bg-status-pending"
                                                    )} />
                                                    {task.status}
                                                </div>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest",
                                                    task.priority === 'High' ? "bg-status-rejected/10 border-status-rejected/20 text-status-rejected" :
                                                        task.priority === 'Medium' ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" :
                                                            "bg-brand-bg border-brand-border text-brand-muted"
                                                )}>
                                                    {task.priority} Priority
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-brand-text tracking-tight">
                                                    {task.description}
                                                </h3>
                                                <button
                                                    onClick={() => handleEditTask(task)}
                                                    className="p-1.5 hover:bg-brand-bg rounded-lg text-brand-muted hover:text-brand-primary transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-[10px] font-black text-brand-muted uppercase tracking-widest bg-brand-bg px-3 py-1 rounded-lg border border-brand-border">
                                            {new Date(task.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Perspective Sidebar */}
                <div className="space-y-8">
                    {/* Activity Brief */}
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-all duration-700"></div>

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-brand-primary" />
                                <h3 className="text-sm font-black text-brand-text uppercase tracking-widest">Entry Metrics</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-brand-bg rounded-3xl border border-brand-border flex flex-col items-center justify-center text-center shadow-inner group/stat relative overflow-hidden">
                                    <div className="absolute inset-0 bg-brand-primary opacity-0 group-hover/stat:opacity-[0.02] transition-opacity"></div>
                                    <span className="text-2xl font-black text-brand-text tabular-nums">{tasks.length}</span>
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Reports</span>
                                </div>
                                <div className="p-6 bg-brand-bg rounded-3xl border border-brand-border flex flex-col items-center justify-center text-center shadow-inner group/stat relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover/stat:opacity-[0.02] transition-opacity"></div>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                        {tasks.filter(t => t.status === 'Completed').length}
                                    </span>
                                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Closed</span>
                                </div>
                            </div>

                            <div className="p-5 bg-brand-primary/5 rounded-3xl border border-brand-primary/10 flex items-center justify-between group/tip">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-primary/10 rounded-xl group-hover/tip:scale-110 transition-transform">
                                        <MessageSquare className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    <span className="text-[10px] font-black text-brand-primary uppercase">Peer Review</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-brand-primary opacity-30 group-hover/tip:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-brand-bg/50 border border-brand-border border-dashed rounded-[2.5rem] text-center">
                        <p className="text-[10px] font-bold text-brand-muted italic leading-relaxed">"Accuracy in documentation is the prerequisite for operational excellence."</p>
                    </div>
                </div>
            </div>

            {/* Premium Entry Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-xl p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative group/modal">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text tracking-tighter uppercase">{isEditing ? 'Refine Entry' : 'New Report'}</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em]">{isEditing ? 'Archival Modification' : 'Professional Documentation'}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-brand-primary transition-all active:scale-90"
                                title="Dismiss"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReport} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-brand-muted text-[10px] font-black uppercase tracking-widest pl-1">Project Identifier</label>
                                    <input
                                        type="text"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-bold text-sm shadow-inner"
                                        placeholder="Internal / Client Code"
                                        value={formData.projectName || ''}
                                        onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-brand-muted text-[10px] font-black uppercase tracking-widest pl-1">Operational Status</label>
                                    <select
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-bold text-sm shadow-inner appearance-none cursor-pointer"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as 'Pending' | 'In Progress' | 'Completed' })}
                                    >
                                        <option value="Completed">Completed</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-brand-muted text-[10px] font-black uppercase tracking-widest pl-1">Activity Description</label>
                                <textarea
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-bold text-sm shadow-inner min-h-[120px] resize-none leading-relaxed"
                                    placeholder="Briefly articulate the objectives achieved today..."
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
                                    <Send className="w-4 h-4" />
                                    {isEditing ? 'Update Records' : 'Submit Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeTasks;
