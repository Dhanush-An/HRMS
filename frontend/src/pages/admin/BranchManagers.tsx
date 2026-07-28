import React, { useState } from 'react';
import {
    Users,
    Heart,
    Star,
    Building2,
    Phone,
    Mail,
    Search,
    Plus,
    XCircle,
    User,
    Lock,
    Eye,
    EyeOff,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle as InactiveIcon
} from 'lucide-react';
import api from '../../api';
import { cn } from '../../utils/cn';

interface BMContact {
    id: string;
    name: string;
    role: string;
    department: string;
    email: string;
    phone: string;
    avatar: string;
    status: 'Active' | 'Inactive';
}

const BranchManagers: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [BMContacts, setBMContacts] = React.useState<BMContact[]>([]);

    const fetchBMEmployees = async () => {
        try {
            const response = await api.get('/api/employees');
            if (response.ok) {
                const data = await response.json();
                const mapped = data
                    .filter((emp: any) => 
                        emp.role === 'subadmin' || 
                        emp.role === 'branchmanager' || 
                        emp.role === 'branch_manager' || 
                        emp.department === 'Administration' || 
                        (emp.employeeId || emp.id)?.startsWith('BranchManagers') ||
                        (emp.employeeId || emp.id)?.startsWith('BM')
                    )
                    .map((emp: any) => ({
                        id: emp.employeeId || emp.id || 'N/A',
                        name: emp.name,
                        role: emp.role || 'subadmin',
                        department: emp.department || 'Administration',
                        email: emp.email,
                        phone: emp.phone || 'N/A',
                        avatar: emp.name ? emp.name.charAt(0).toUpperCase() : 'U',
                        status: (emp.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive'
                    }));
                setBMContacts(mapped);
            }
        } catch (error) {
            console.error('Error fetching BranchManagers employees:', error);
        }
    };

    React.useEffect(() => {
        fetchBMEmployees();
    }, []);

    // ── Add BranchManagers Modal state ──────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        role: '',
        department: 'Administration',
        status: 'Active',
        phone: '',
        joiningDate: new Date().toISOString().split('T')[0],
        username: '',
        password: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            setFormData({ ...formData, [name]: value.replace(/\D/g, '').slice(0, 10) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const openModal = async () => {
        setIsEditing(false);
        let nextId = 'BM001';
        try {
            const res = await api.get('/api/employees');
            if (res.ok) {
                const employees = await res.json();
                const BMIds = employees
                    .map((emp: any) => emp.employeeId || emp.id)
                    .filter((id: string) => id?.startsWith('BranchManagers'))
                    .map((id: string) => parseInt(id.replace('BranchManagers', ''), 10))
                    .filter((num: number) => !isNaN(num));

                if (BMIds.length > 0) {
                    const maxId = Math.max(...BMIds);
                    nextId = `BranchManagers${String(maxId + 1).padStart(3, '0')}`;
                }
            }
        } catch (error) {
            console.error('Error fetching employees to generate ID:', error);
        }

        setFormData({
            id: nextId,
            name: '',
            email: '',
            role: 'subadmin',
            department: 'Administration',
            status: 'Active',
            phone: '',
            joiningDate: new Date().toISOString().split('T')[0],
            username: '',
            password: ''
        });
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const openEditModal = (contact: BMContact) => {
        setFormData({
            id: contact.id,
            name: contact.name,
            email: contact.email,
            role: contact.role,
            department: contact.department,
            status: contact.status || 'Active',
            phone: contact.phone === 'N/A' ? '' : contact.phone,
            joiningDate: new Date().toISOString().split('T')[0],
            username: '',
            password: ''
        });
        setIsEditing(true);
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (contact: BMContact) => {
        const newStatus = contact.status === 'Active' ? 'Inactive' : 'Active';
        try {
            const res = await api.put(`/api/employees/${contact.id}/status`, { status: newStatus });
            if (res.ok) {
                fetchBMEmployees();
            } else {
                const fallbackRes = await api.put(`/api/employees/${contact.id}`, { status: newStatus });
                if (fallbackRes.ok) fetchBMEmployees();
            }
        } catch (err: any) {
            console.error('Error toggling status:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this BranchManagers member?')) return;
        try {
            const res = await api.delete(`/api/employees/${id}`);
            if (res.ok) {
                fetchBMEmployees();
            } else {
                const data = await res.json();
                alert(data.message || 'Error deleting');
            }
        } catch (err: any) {
            alert(`Error deleting: ${err.message}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = isEditing
                ? await api.put(`/api/employees/${formData.id}`, formData)
                : await api.post('/api/employees', formData);
            if (res.ok) {
                setIsModalOpen(false);
                fetchBMEmployees();
            }
        } catch (err: any) {
            alert(`Error saving: ${err.message || 'Unknown error'}`);
        }
    };

    const filteredContacts = BMContacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
                        <Building2 className="w-7 h-7 text-brand-primary" />
                        Administration
                    </h1>
                    <p className="text-brand-muted text-sm mt-1">Manage your people, culture, and organizational health</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <Heart className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-600">Engagement: 87%</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
                        <Star className="w-3.5 h-3.5 text-brand-primary" />
                        <span className="text-xs font-semibold text-brand-primary">eNPS: 42</span>
                    </div>
                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:opacity-90 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Branch Manager
                    </button>
                </div>
            </div>

            {/* BranchManagers Team List */}
            <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                        <input
                            type="text"
                            placeholder="Search BranchManagers team members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                className="bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-brand-primary/30 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-brand-primary/20 flex-shrink-0">
                                        {contact.avatar}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-brand-text group-hover:text-brand-primary transition-colors truncate text-sm sm:text-base">{contact.name}</p>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                contact.status === 'Active'
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                            )}>
                                                {contact.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-brand-muted truncate">{contact.department}</p>
                                        </div>
                                    </div>
                                </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-6 w-full sm:w-auto border-t sm:border-t-0 border-brand-border pt-4 sm:pt-0">
                                        <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-brand-muted">
                                                <Mail className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                                                <span className="truncate max-w-[150px] sm:max-w-none">{contact.email}</span>
                                            </div>
                                            <div className="items-center gap-2 text-xs sm:text-sm text-brand-muted hidden md:flex">
                                                <Phone className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                                                <span>{contact.phone}</span>
                                            </div>
                                        </div>

                                        {/* ACTIVE / INACTIVE BUTTON */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(contact); }}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-shrink-0 cursor-pointer active:scale-95 border",
                                                contact.status === 'Active'
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20"
                                            )}
                                            title="Click to toggle Active / Inactive status"
                                        >
                                            {contact.status === 'Active' ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                                <InactiveIcon className="w-3.5 h-3.5 text-rose-500" />
                                            )}
                                            <span>{contact.status}</span>
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(contact); }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Delete</span>
                                        </button>
                                    </div>
                            </div>
                        ))}
                    </div>

                    {filteredContacts.length === 0 && (
                        <div className="text-center py-16 text-brand-muted">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No BranchManagers team members found</p>
                            <p className="text-sm mt-1">Try a different search term</p>
                        </div>
                    )}
                </div>
            {/* Add Branch Manager Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 sm:mb-8">
                            <h2 className="text-xl sm:text-2xl font-black text-brand-text">{isEditing ? 'Edit Branch Manager' : 'Add Branch Manager'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-colors text-brand-muted">
                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Full Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-3 sm:p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">BranchManagers ID</label>
                                    <input
                                        name="id"
                                        value={formData.id}
                                        onChange={handleInputChange}
                                        placeholder="Auto-generated if empty"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-3 sm:p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base disabled:opacity-50"
                                        disabled={isEditing}
                                    />
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Username</label>
                                        <div className="relative group/field">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within/field:text-brand-primary transition-colors" />
                                            <input
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                placeholder="Custom username"
                                                className="w-full bg-brand-bg border border-brand-border rounded-2xl py-3 sm:py-4 pl-12 pr-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Initial Password</label>
                                        <div className="relative group/field">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within/field:text-brand-primary transition-colors" />
                                            <input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="••••••••"
                                                className="w-full bg-brand-bg border border-brand-border rounded-2xl py-3 sm:py-4 pl-12 pr-12 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-primary/60 hover:text-brand-primary transition-all z-10 flex items-center justify-center rounded-lg hover:bg-brand-primary/5"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Email Address</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="name@company.com"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-3 sm:p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Phone Number</label>
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="10 digit number"
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        title="Please enter exactly 10 digits"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-3 sm:p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Role</label>
                                    <div className="w-full bg-brand-bg border border-brand-primary/30 rounded-2xl p-3 sm:p-4 flex items-center gap-3 cursor-not-allowed">
                                        <span className="px-2.5 py-0.5 bg-brand-primary/10 text-brand-primary text-xs font-black rounded-full uppercase tracking-widest border border-brand-primary/20">BM</span>
                                        <span className="text-brand-muted text-sm font-medium">Branch Manager</span>
                                        <input type="hidden" name="role" value="subadmin" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-3 sm:p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base cursor-pointer"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Department</label>
                                    <input
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-3 sm:p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1.5 sm:mb-2">Joining Date</label>
                                    <input
                                        name="joiningDate"
                                        type="date"
                                        value={formData.joiningDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-3 sm:p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm sm:text-base"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 sm:gap-4 mt-8 sm:mt-10">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 sm:py-4 rounded-2xl border border-brand-border text-brand-text font-bold hover:bg-brand-bg transition-colors active:scale-95 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 sm:py-4 rounded-2xl bg-brand-primary text-white font-black hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95 text-sm"
                                >
                                    {isEditing ? 'Save Changes' : 'Save Branch Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManagers;
