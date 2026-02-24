import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ShieldCheck,
    Clock,
    CheckCircle,
    Book,
    XCircle,
    Info,
    Palette
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../api';

interface Policy {
    id: number;
    title: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    lastUpdated: string;
}

const ICON_MAP: Record<string, any> = {
    ShieldCheck,
    Clock,
    CheckCircle,
    Book,
    Info
};

const COLOR_OPTIONS = [
    { name: 'Blue (Brand)', color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' },
    { name: 'Purple', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { name: 'Green', color: 'text-status-approved', bg: 'bg-status-approved/10', border: 'border-status-approved/20' },
    { name: 'Amber', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { name: 'Indigo', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { name: 'Rose', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
];

const ICON_OPTIONS = ['ShieldCheck', 'Clock', 'CheckCircle', 'Book', 'Info'];

const AdminPolicies = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: 'ShieldCheck',
        color: COLOR_OPTIONS[0].color,
        bgColor: COLOR_OPTIONS[0].bg,
        borderColor: COLOR_OPTIONS[0].border
    });

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const response = await api.get('/api/policies');
            const data = await response.json();
            setPolicies(data);
        } catch (error) {
            console.error('Error fetching policies:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleColorSelect = (option: typeof COLOR_OPTIONS[0]) => {
        setFormData({
            ...formData,
            color: option.color,
            bgColor: option.bg,
            borderColor: option.border
        });
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({
            title: '',
            description: '',
            icon: 'ShieldCheck',
            color: COLOR_OPTIONS[0].color,
            bgColor: COLOR_OPTIONS[0].bg,
            borderColor: COLOR_OPTIONS[0].border
        });
        setIsModalOpen(true);
    };

    const openEditModal = (policy: Policy) => {
        setIsEditing(true);
        setSelectedPolicy(policy);
        setFormData({
            title: policy.title,
            description: policy.description,
            icon: policy.icon,
            color: policy.color,
            bgColor: policy.bgColor,
            borderColor: policy.borderColor
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this policy?')) {
            try {
                await api.delete(`/api/policies/${id}`);
                fetchPolicies();
            } catch (error) {
                console.error('Error deleting policy:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = isEditing && selectedPolicy
                ? await api.put(`/api/policies/${selectedPolicy.id}`, formData)
                : await api.post('/api/policies', formData);

            if (response.ok) {
                setIsModalOpen(false);
                fetchPolicies();
            }
        } catch (error) {
            console.error('Error saving policy:', error);
        }
    };

    const filteredPolicies = policies.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight uppercase">Policy Master</h1>
                    <p className="text-brand-muted font-medium italic">Define and manage institutional standards globally.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="w-full sm:w-auto bg-brand-primary hover:opacity-90 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-primary/20 font-bold text-xs uppercase tracking-widest"
                >
                    <Plus className="w-5 h-5" />
                    Create Policy
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input
                        type="text"
                        placeholder="Search institutional policies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-2xl py-4 pl-12 pr-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all font-medium placeholder:text-brand-muted/50 text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredPolicies.map((policy) => {
                    const Icon = ICON_MAP[policy.icon] || Info;
                    return (
                        <div key={policy.id} className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 flex flex-col md:flex-row items-start md:items-center gap-8 hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className={`p-5 rounded-2xl ${policy.bgColor} border ${policy.borderColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                <Icon className={`w-10 h-10 ${policy.color}`} />
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                                    <h3 className="text-xl font-black text-brand-text uppercase tracking-tight">{policy.title}</h3>
                                    <span className="text-[9px] font-black text-brand-muted bg-brand-bg px-4 py-1.5 rounded-full border border-brand-border uppercase tracking-[0.2em]">Sync: {policy.lastUpdated}</span>
                                </div>
                                <p className="text-brand-muted font-medium leading-relaxed italic opacity-85">"{policy.description}"</p>
                            </div>

                            <div className="flex gap-3 md:self-center">
                                <button
                                    onClick={() => openEditModal(policy)}
                                    className="p-4 bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary rounded-2xl transition-all active:scale-95 shadow-sm"
                                    title="Edit Policy"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(policy.id)}
                                    className="p-4 bg-brand-bg border border-brand-border text-brand-muted hover:text-rose-500 hover:border-rose-500 rounded-2xl transition-all active:scale-95 shadow-sm"
                                    title="Delete Policy"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredPolicies.length === 0 && (
                    <div className="text-center py-20 bg-brand-bg border border-brand-border border-dashed rounded-[2.5rem]">
                        <p className="text-brand-muted font-bold italic">No policies found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-surface/80 backdrop-blur-xl">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text uppercase tracking-tight">{isEditing ? 'Modify Policy' : 'Define Policy'}</h2>
                                <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mt-1">Changes are synced in real-time</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-brand-bg rounded-2xl transition-colors text-brand-muted">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">Policy Title</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter policy header..."
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-5 text-brand-text focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">Core Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the institutional guidelines..."
                                    rows={4}
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-5 text-brand-text focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium leading-relaxed italic"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-[0.2em] flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3" /> Select Icon
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {ICON_OPTIONS.map(iconName => {
                                            const Icon = ICON_MAP[iconName];
                                            return (
                                                <button
                                                    key={iconName}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, icon: iconName })}
                                                    className={cn(
                                                        "p-3 rounded-xl border transition-all flex items-center justify-center",
                                                        formData.icon === iconName
                                                            ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20 scale-110"
                                                            : "bg-brand-bg border-brand-border text-brand-muted hover:border-brand-primary/30"
                                                    )}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-[0.2em] flex items-center gap-2">
                                        <Palette className="w-3 h-3" /> Select Theme
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLOR_OPTIONS.map(option => (
                                            <button
                                                key={option.name}
                                                type="button"
                                                onClick={() => handleColorSelect(option)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full border-2 transition-all",
                                                    formData.color === option.color
                                                        ? "border-brand-primary scale-125 shadow-lg"
                                                        : "border-transparent opacity-60 hover:opacity-100"
                                                )}
                                                style={{ backgroundColor: option.color.replace('text-', '') === 'brand-primary' ? '#4F46E5' : option.color.replace('text-', '').replace('-500', '') }}
                                                title={option.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-8 bg-brand-bg/50 border-t border-brand-border flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-5 rounded-2xl border border-brand-border text-brand-text font-black text-xs uppercase tracking-widest hover:bg-brand-bg transition-all active:scale-95"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-2 bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-xl shadow-brand-primary/20 transition-all active:scale-95 px-12"
                            >
                                {isEditing ? 'Commit Changes' : 'Publish Policy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPolicies;
