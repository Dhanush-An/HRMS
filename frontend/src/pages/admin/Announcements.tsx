import { useState, useEffect, memo } from 'react';
import { Megaphone, Bell, Calendar, Send, Sparkles, Filter, MoreHorizontal, Edit2, Trash2, X } from 'lucide-react';
import api from '../../api';

interface Announcement {
    _id?: string; // MongoDB ID
    id: string; // Potential legacy ID
    title: string;
    message: string;
    type: 'Company' | 'HR' | 'Salary' | 'Holiday';
    date: string;
}

const getTypeColor = (type: string) => {
    switch (type) {
        case 'Holiday': return 'bg-emerald-500';
        case 'HR': return 'bg-indigo-500';
        case 'Salary': return 'bg-amber-500';
        default: return 'bg-brand-primary';
    }
};

const getTypeStyles = (type: string) => {
    switch (type) {
        case 'Holiday': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        case 'HR': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
        case 'Salary': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        default: return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
    }
};

const AnnouncementCard = memo(({ ann, idx, onEdit, onDelete }: { ann: Announcement; idx: number; onEdit: (ann: Announcement) => void; onDelete: (id: string) => void }) => {
    const [showOptions, setShowOptions] = useState(false);

    return (
        <div
            className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-2xl hover:border-brand-primary/20 transition-all duration-500 animate-in slide-in-from-right-4"
            style={{ animationDelay: `${idx * 100}ms` }}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getTypeColor(ann.type)} shadow-[2px_0_10px_rgba(0,0,0,0.1)]`}></div>

            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getTypeStyles(ann.type)}`}>
                        {ann.type}
                    </span>
                    <span className="text-brand-muted text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-brand-bg px-3 py-1.5 rounded-xl border border-brand-border">
                        <Calendar className="w-3.5 h-3.5" />
                        {ann.date}
                    </span>
                </div>
                <div className="relative">
                    <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-2 text-brand-muted hover:text-brand-text hover:bg-brand-bg rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {showOptions && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-brand-surface border border-brand-border rounded-2xl shadow-xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => {
                                    onEdit(ann);
                                    setShowOptions(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-text hover:bg-brand-bg transition-colors border-b border-brand-border"
                            >
                                <Edit2 className="w-4 h-4 text-brand-primary" />
                                Edit Post
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(ann._id || ann.id);
                                    setShowOptions(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-status-rejected hover:bg-brand-bg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Post
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-2xl font-black text-brand-text mb-4 group-hover:text-brand-primary transition-colors tracking-tight">{ann.title}</h3>
            <p className="text-brand-muted font-medium whitespace-pre-wrap leading-relaxed text-sm bg-brand-bg/30 p-6 rounded-3xl border border-brand-border/50 group-hover:border-brand-border transition-all">{ann.message}</p>

            <div className="mt-6 flex justify-end">
                <div className="h-1 w-20 bg-brand-border/30 rounded-full group-hover:bg-brand-primary/20 transition-all duration-700"></div>
            </div>
        </div>
    );
});

const AnnouncementForm = ({ onPostSuccess, editingAnnouncement, onCancelEdit }: { onPostSuccess: () => void; editingAnnouncement?: Announcement | null; onCancelEdit?: () => void }) => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'Company'
    });
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        if (editingAnnouncement) {
            setFormData({
                title: editingAnnouncement.title,
                message: editingAnnouncement.message,
                type: editingAnnouncement.type
            });
        } else {
            setFormData({ title: '', message: '', type: 'Company' });
        }
    }, [editingAnnouncement]);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        try {
            const url = editingAnnouncement 
                ? `/api/announcements/${editingAnnouncement._id || editingAnnouncement.id}` 
                : '/api/announcements';
            const method = editingAnnouncement ? 'PUT' : 'POST';
            
            const response = await api[method === 'POST' ? 'post' : 'put'](url, formData);
            if (response.ok) {
                onPostSuccess();
                setFormData({ title: '', message: '', type: 'Company' });
                if (onCancelEdit) onCancelEdit();
            }
        } catch (error) {
            console.error("Error posting announcement:", error);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-xl sticky top-8 animate-in slide-in-from-left-4 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20">
                        <Megaphone className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-brand-text tracking-tight">
                            {editingAnnouncement ? 'Edit Broadcast' : 'New Broadcast'}
                        </h2>
                        <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest">Share important updates</p>
                    </div>
                </div>
                {editingAnnouncement && (
                    <button 
                        onClick={onCancelEdit}
                        className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-brand-text transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <form onSubmit={handlePost} className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-3 ml-1 block">Subject Title</label>
                    <input
                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-black text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm placeholder-brand-muted/50"
                        placeholder="Enter headline..."
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-3 ml-1 block">Broadcast Category</label>
                    <div className="custom-select-container">
                        <select
                            className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-black text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                        >
                            <option value="Company" className="bg-brand-surface text-brand-text">General Company</option>
                            <option value="HR" className="bg-brand-surface text-brand-text">Human Resources</option>
                            <option value="Salary" className="bg-brand-surface text-brand-text">Finance & Payroll</option>
                            <option value="Holiday" className="bg-brand-surface text-brand-text">Vacation & Holidays</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-3 ml-1 block">Detailed Message</label>
                    <textarea
                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-5 text-brand-text font-medium text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm placeholder-brand-muted/50 resize-none min-h-[200px]"
                        placeholder="Write your announcement details here..."
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        required
                    ></textarea>
                </div>
                <div className="flex gap-4">
                    {editingAnnouncement && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="flex-1 bg-brand-bg border border-brand-border hover:bg-brand-surface text-brand-text py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isPosting}
                        className="flex-[2] bg-brand-primary hover:opacity-90 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        {isPosting ? 'Saving...' : editingAnnouncement ? 'Update Broadcast' : 'Post Announcement'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const Announcements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const fetchData = async () => {
        try {
            const response = await api.get('/api/announcements');
            const data = await response.json();
            setAnnouncements(data.reverse()); // Show newest first
        } catch (error) {
            console.error("Error fetching announcements:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
        try {
            const response = await api.delete(`/api/announcements/${id}`);
            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Broadcast Center</h1>
                    <p className="text-brand-muted font-medium">Keep your workforce informed and engaged.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Announcement Form */}
                <div className="lg:col-span-1">
                    <AnnouncementForm 
                        onPostSuccess={fetchData} 
                        editingAnnouncement={editingAnnouncement}
                        onCancelEdit={() => setEditingAnnouncement(null)}
                    />
                </div>

                {/* Announcement List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Bell className="w-6 h-6 text-amber-500 animate-bounce" />
                            <h2 className="text-xl font-black text-brand-text tracking-tight uppercase">Recent Broadcasts</h2>
                        </div>
                        <button className="p-2 hover:bg-brand-bg rounded-xl transition-colors text-brand-muted hover:text-brand-text">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>

                    {Array.isArray(announcements) && announcements.length === 0 ? (
                        <div className="text-center py-20 bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-brand-muted opacity-20" />
                            </div>
                            <h3 className="text-xl font-black text-brand-text mb-2">Clear Skies</h3>
                            <p className="text-brand-muted font-medium text-sm">No recent announcements to display.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Array.isArray(announcements) && announcements.map((ann, idx) => (
                                <AnnouncementCard 
                                    key={ann._id || ann.id} 
                                    ann={ann} 
                                    idx={idx} 
                                    onEdit={setEditingAnnouncement}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Announcements;
