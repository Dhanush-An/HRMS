import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Mail,
    Phone,
    Trash2,
    Edit2,
    Eye,
    EyeOff,
    XCircle,
    FileText,
    Calendar,
    Filter,
    Lock,
    User,
    MoreVertical,
    UserMinus,
    ShieldCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../api';
import { OfferLetterModal } from '../../components/OfferLetterModal';

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: string;
    joiningDate: string;
    phone?: string;
    branchName?: string;
    responsibilities?: string;
    address?: string;
    aadharNo?: string;
    trainingSalary?: number;
    engagementType?: 'Training' | 'Employment';
    reportsTo?: string;
    workLocation?: string;
    shiftWindow?: string;
    offerId?: string;
    offerIssueDate?: string;
    offerLetterUrl?: string;
    salary?: any;
}

const Employees = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedEmployeeForRole, setSelectedEmployeeForRole] = useState<Employee | null>(null);
    const [roleResponsibilities, setRoleResponsibilities] = useState('');

    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [selectedEmployeeForOffer, setSelectedEmployeeForOffer] = useState<any>(null);
    const [isNewOfferProcess, setIsNewOfferProcess] = useState(false);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        role: 'Junior AI Associate Developer',
        department: 'IT',
        status: 'Active',
        phone: '',
        joiningDate: new Date().toISOString().split('T')[0],
        username: '',
        password: '',
        address: '',
        aadharNo: '',
        engagementType: 'Training' as 'Training' | 'Employment',
        basicSalary: 0,
        hraSalary: 0,
        convSalary: 0,
        pfSalary: 0,
        esiSalary: 0,
        trainingSalary: 0,
        reportsTo: '',
        workLocation: 'Bangalore (Onsite)',
        shiftWindow: '9:30 AM - 6:30 PM',
        responsibilities: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isCustomRole, setIsCustomRole] = useState(false);

    const PREDEFINED_ROLES = [
        'Employee', 'Human Resource', 'HR Recruiter', 'HR Recruiter (HR Access)',
        'Junior AI Associate Developer', 'Software Developer', 'Frontend Developer',
        'Backend Developer', 'Full Stack Developer', 'UI/UX Designer',
        'QA / Test Engineer', 'HR Executive', 'HR Manager', 'Project Manager', 'Team Lead'
    ];

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/api/employees');
            const data = await response.json();
            const filtered = Array.isArray(data) ? data.filter((e: any) => e.role !== 'subadmin' && e.role !== 'admin') : [];
            setEmployees(filtered);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            // Only allow numbers and max 10 digits
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setIsCustomRole(false);
        setFormData({
            id: '',
            name: '',
            email: '',
            role: 'Employee',
            department: 'IT',
            status: 'Active',
            phone: '',
            joiningDate: new Date().toISOString().split('T')[0],
            username: '',
            password: '',
            address: '',
            aadharNo: '',
            engagementType: 'Training' as 'Training' | 'Employment',
            basicSalary: 0,
            hraSalary: 0,
            convSalary: 0,
            pfSalary: 0,
            esiSalary: 0,
            trainingSalary: 0,
            reportsTo: '',
            workLocation: '',
            shiftWindow: '',
            responsibilities: ''
        });
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setIsEditing(true);
        setSelectedEmployee(employee);
        if (employee.role && !PREDEFINED_ROLES.includes(employee.role)) {
            setIsCustomRole(true);
        } else {
            setIsCustomRole(false);
        }
        setFormData({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            department: employee.department,
            status: employee.status,
            phone: employee.phone || '',
            joiningDate: employee.joiningDate,
            username: (employee as any).username || employee.email,
            password: '',
            address: employee.address || '',
            aadharNo: employee.aadharNo || '',
            engagementType: (employee.engagementType || 'Training') as 'Training' | 'Employment',
            basicSalary: employee.salary?.basic ?? 0,
            hraSalary: employee.salary?.hra ?? 0,
            convSalary: employee.salary?.conveyance ?? 0,
            pfSalary: employee.salary?.pf ?? 0,
            esiSalary: employee.salary?.esi ?? 0,
            trainingSalary: employee.trainingSalary ?? 15000,
            reportsTo: employee.reportsTo || 'TL',
            workLocation: employee.workLocation || 'Bangalore (Onsite)',
            shiftWindow: employee.shiftWindow || '9:30 AM - 6:30 PM',
            responsibilities: employee.responsibilities || ''
        });
        setIsModalOpen(true);
    };

    const openProfile = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsProfileOpen(true);
    };

    const openOfferLetter = (employee: Employee) => {
        setSelectedEmployeeForOffer({
            ...employee,
            engagementType: employee.engagementType || 'Employment'
        });
        setIsNewOfferProcess(false);
        setIsOfferModalOpen(true);
        setIsProfileOpen(false);
        setActiveDropdown(null);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                const response = await api.delete(`/api/employees/${id}`);
                if (response.ok) {
                    fetchEmployees();
                }
            } catch (error) {
                console.error('Error deleting employee:', error);
            }
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!window.confirm('Are you sure you want to deactivate this employee?')) return;
        try {
            const response = await api.put(`/api/employees/${id}/status`, { status: 'Inactive' });
            if (response.ok) {
                fetchEmployees();
                setActiveDropdown(null);
            }
        } catch (error) {
            console.error("Error deactivating employee:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                ...formData,
                salary: {
                    basic: Number(formData.basicSalary) || 0,
                    hra: Number(formData.hraSalary) || 0,
                    conveyance: Number(formData.convSalary) || 0,
                    pf: Number(formData.pfSalary) || 0,
                    esi: Number(formData.esiSalary) || 0,
                    medical: 0,
                    special: 0,
                    other: 0,
                    tax: 0
                }
            };

            if (!payload.username || payload.username.trim() === '') {
                delete payload.username;
            }
            if (!payload.password || payload.password.trim() === '') {
                delete payload.password;
            }

            const response = isEditing && selectedEmployee
                ? await api.put(`/api/employees/${selectedEmployee.id}`, payload)
                : await api.post('/api/employees', payload);

            if (response.ok) {
                const savedEmployee = await response.json();
                setIsModalOpen(false);
                fetchEmployees();

                if (!isEditing) {
                    // Show offer letter processing & preview modal!
                    setSelectedEmployeeForOffer({
                        ...savedEmployee,
                        engagementType: formData.engagementType
                    });
                    setIsNewOfferProcess(true);
                    setIsOfferModalOpen(true);
                }
            } else {
                const err = await response.json();
                alert(`Error saving employee: ${err.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('Error saving employee:', error);
            alert(`Error saving employee: ${error.message || 'Unknown error'}`);
        }
    };

    const openRoleModal = (employee: Employee) => {
        setSelectedEmployeeForRole(employee);
        setRoleResponsibilities(employee.responsibilities || '');
        setIsRoleModalOpen(true);
        setActiveDropdown(null);
    };

    const handleSaveRoleResponsibilities = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeForRole) return;
        try {
            const response = await api.put(`/api/employees/${selectedEmployeeForRole.id}`, {
                responsibilities: roleResponsibilities
            });
            if (response.ok) {
                setIsRoleModalOpen(false);
                fetchEmployees();
            } else {
                const err = await response.json();
                alert(`Error saving responsibilities: ${err.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('Error saving responsibilities:', error);
            alert(`Error saving responsibilities: ${error.message || 'Unknown error'}`);
        }
    };
    const filteredEmployees = employees
        .filter(emp => emp.role !== 'hr' && emp.department !== 'Human Resources')
        .filter(emp =>
            emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase())
        );


    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight">Employee Management</h1>
                    <p className="text-brand-muted font-medium text-sm md:text-base">Manage and monitor your workforce efficiently.</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        openAddModal();
                    }}
                    className="w-full sm:w-auto bg-brand-primary hover:opacity-90 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-primary/20 font-bold text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Employee
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-2xl py-3 pl-12 pr-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all font-medium placeholder:text-brand-muted/50 text-sm"
                    />
                </div>
                <button className="bg-brand-surface border border-brand-border text-brand-text px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-bg transition-colors font-bold text-sm shadow-sm sm:w-auto">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            {/* Employee List - Table View (Desktop) */}
            <div className="hidden md:block bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-table-header border-b border-brand-border">
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Employee</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Role & Dept</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Contact</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Status</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Joined Date</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {Array.isArray(filteredEmployees) && filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-brand-bg transition-colors group cursor-pointer" onClick={() => openProfile(emp)}>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary-light flex items-center justify-center text-brand-primary font-black shadow-sm group-hover:scale-105 transition-transform">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-brand-text font-bold text-sm">{emp.name}</div>
                                        <div className="text-brand-muted text-[10px] font-mono tracking-tighter">{emp.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="text-brand-text font-bold text-sm">{emp.role}</div>
                                <div className="text-brand-muted text-xs font-medium">{emp.department}{emp.branchName ? ` • ${emp.branchName}` : ''}</div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-brand-text text-xs font-medium">
                                        <Mail className="w-3 h-3 text-brand-primary" />
                                        {emp.email}
                                    </div>
                                    {emp.phone && (
                                        <div className="flex items-center gap-1.5 text-brand-muted text-xs font-medium">
                                            <Phone className="w-3 h-3 text-brand-muted" />
                                            {emp.phone}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        emp.status === 'Active' ? "bg-status-approved" : "bg-status-rejected"
                                    )} />
                                    <span className={cn(
                                        "text-xs font-bold",
                                        emp.status === 'Active' ? "text-status-approved" : "text-status-rejected"
                                    )}>
                                        {emp.status}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="text-brand-text text-sm font-medium">{emp.joiningDate}</div>
                            </td>
                            <td className="px-4 py-4 text-right">
                                    <div className="flex justify-end gap-2 px-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(emp);
                                            }}
                                            className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-primary-light rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(emp.id);
                                            }}
                                            className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === emp.id ? null : emp.id);
                                                }}
                                                className="p-2 text-brand-muted hover:text-brand-text hover:bg-brand-bg rounded-lg transition-all"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {activeDropdown === emp.id && (
                                                <>
                                                    <div className="fixed inset-0 z-[5]" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }} />
                                                    <div 
                                                        className="absolute right-0 mt-2 w-48 bg-brand-surface border border-brand-border rounded-xl shadow-xl z-10 py-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => openOfferLetter(emp)}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-500 hover:bg-amber-500/10 flex items-center gap-2 transition-colors border-b border-brand-border"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            Offer Letter
                                                        </button>
                                                        <button
                                                            onClick={() => openRoleModal(emp)}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-brand-primary hover:bg-brand-primary-light flex items-center gap-2 transition-colors border-b border-brand-border"
                                                        >
                                                            <ShieldCheck className="w-3.5 h-3.5" />
                                                            Role & Responsibility
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeactivate(emp.id)}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors pt-2.5"
                                                        >
                                                            <UserMinus className="w-3.5 h-3.5" />
                                                            Deactivate
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Employee List - Card View (Mobile) */}
            <div className="md:hidden space-y-4">
                {Array.isArray(filteredEmployees) && filteredEmployees.map((emp) => (
                    <div
                        key={emp.id}
                        onClick={() => openProfile(emp)}
                        className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-primary-light flex items-center justify-center text-brand-primary font-black text-lg shadow-sm">
                                    {emp.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-brand-text font-black text-base">{emp.name}</div>
                                    <div className="text-brand-muted text-[10px] font-bold uppercase tracking-widest">{emp.department}{emp.branchName ? ` • ${emp.branchName}` : ''}</div>
                                </div>
                            </div>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                emp.status === 'Active'
                                    ? "bg-status-approved/10 text-status-approved border-status-approved/20"
                                    : "bg-status-rejected/10 text-status-rejected border-status-rejected/20"
                            )}>
                                {emp.status}
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-brand-border border-dashed">
                            <div className="flex items-center gap-3 text-brand-muted text-xs font-medium">
                                <Mail className="w-4 h-4 text-brand-primary" />
                                <span className="truncate">{emp.email}</span>
                            </div>
                            {emp.phone && (
                                <div className="flex items-center gap-3 text-brand-muted text-xs font-medium">
                                    <Phone className="w-4 h-4 text-brand-primary" />
                                    {emp.phone}
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-brand-muted text-xs font-medium">
                                <Calendar className="w-4 h-4 text-brand-primary" />
                                Joined {emp.joiningDate}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(emp);
                                }}
                                className="flex-1 bg-brand-bg border border-brand-border text-brand-text py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(emp.id);
                                }}
                                className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-3xl p-5 md:p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-brand-text">{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-colors text-brand-muted">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Full Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Employee ID</label>
                                    <input
                                        name="id"
                                        value={formData.id}
                                        onChange={handleInputChange}
                                        placeholder="Auto-generated if empty"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium disabled:opacity-50"
                                        disabled={isEditing}
                                    />
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Username</label>
                                        <div className="relative group/field">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within/field:text-brand-primary transition-colors" />
                                            <input
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                placeholder="Custom username"
                                                className="w-full bg-brand-bg border border-brand-border rounded-2xl py-4 pl-12 pr-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Initial Password</label>
                                        <div className="relative group/field">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within/field:text-brand-primary transition-colors" />
                                            <input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="••••••••"
                                                className="w-full bg-brand-bg border border-brand-border rounded-2xl py-4 pl-12 pr-12 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Email Address</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="name@company.com"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Phone Number</label>
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="10 digit number"
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        title="Please enter exactly 10 digits"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest">Role / System Access</label>
                                        {isCustomRole && (
                                            <button
                                                type="button"
                                                onClick={() => { setIsCustomRole(false); setFormData({ ...formData, role: 'Employee' }); }}
                                                className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer"
                                            >
                                                ← Back to List
                                            </button>
                                        )}
                                    </div>
                                    {isCustomRole ? (
                                        <input
                                            type="text"
                                            name="role"
                                            value={formData.role === 'Other' ? '' : formData.role}
                                            onChange={handleInputChange}
                                            placeholder="Type custom role title..."
                                            className="w-full bg-brand-bg border border-brand-primary rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm"
                                            required
                                            autoFocus
                                        />
                                    ) : (
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={(e) => {
                                                if (e.target.value === 'Other') {
                                                    setIsCustomRole(true);
                                                    setFormData({ ...formData, role: '' });
                                                } else {
                                                    handleInputChange(e);
                                                }
                                            }}
                                            className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-bold text-sm cursor-pointer"
                                            required
                                        >
                                            <option value="Employee">Employee (Employee Dashboard Access)</option>
                                            <option value="Human Resource">Human Resource (HR Dashboard Access)</option>
                                            <option value="HR Recruiter">HR Recruiter (Employee Dashboard Access)</option>
                                            <option value="HR Recruiter (HR Access)">HR Recruiter (HR Dashboard Access)</option>
                                            <option value="Junior AI Associate Developer">Junior AI Associate Developer (Employee Access)</option>
                                            <option value="Software Developer">Software Developer (Employee Access)</option>
                                            <option value="Frontend Developer">Frontend Developer (Employee Access)</option>
                                            <option value="Backend Developer">Backend Developer (Employee Access)</option>
                                            <option value="Full Stack Developer">Full Stack Developer (Employee Access)</option>
                                            <option value="UI/UX Designer">UI/UX Designer (Employee Access)</option>
                                            <option value="QA / Test Engineer">QA / Test Engineer (Employee Access)</option>
                                            <option value="HR Executive">HR Executive (HR Access)</option>
                                            <option value="HR Manager">HR Manager (HR Access)</option>
                                            <option value="Project Manager">Project Manager (Employee Access)</option>
                                            <option value="Team Lead">Team Lead (Employee Access)</option>
                                            <option value="Other">Other (Specify Custom Role...)</option>
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Department</label>
                                    <input
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Joining Date</label>
                                    <input
                                        name="joiningDate"
                                        type="date"
                                        value={formData.joiningDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Employee Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full address (e.g. #14/A, 1st main, kaveri nagara...)"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm min-h-[90px] resize-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Aadhar Number</label>
                                    <input
                                        name="aadharNo"
                                        value={formData.aadharNo}
                                        onChange={(e) => setFormData({ ...formData, aadharNo: e.target.value })}
                                        placeholder="12 Digit Aadhar Number"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium mb-4"
                                    />
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Reports To</label>
                                    <input
                                        name="reportsTo"
                                        value={formData.reportsTo}
                                        onChange={handleInputChange}
                                        placeholder="e.g. TL"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Salary Structure Section */}
                            <div className="p-4 bg-brand-bg/50 border border-brand-border rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-brand-primary">Salary Structure & Stipend</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Offer Mode:</span>
                                        <div className="flex bg-slate-900 border border-amber-500/40 p-1 rounded-xl gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, engagementType: 'Training' })}
                                                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                                    (formData.engagementType || 'Training') === 'Training'
                                                        ? 'bg-amber-500 text-slate-950 shadow-md'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Training
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, engagementType: 'Employment' })}
                                                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                                    formData.engagementType === 'Employment'
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Employment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-bold uppercase text-brand-muted mb-1">Basic (Monthly)</label>
                                        <input
                                            type="number"
                                            name="basicSalary"
                                            value={formData.basicSalary || ''}
                                            placeholder="0"
                                            onChange={(e) => {
                                                const basic = Number(e.target.value) || 0;
                                                setFormData({
                                                    ...formData,
                                                    basicSalary: basic,
                                                    hraSalary: Math.round(basic * 0.5)
                                                });
                                            }}
                                            className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-brand-text font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold uppercase text-brand-muted mb-1">HRA (50% of Basic)</label>
                                        <input
                                            type="number"
                                            name="hraSalary"
                                            value={formData.hraSalary || (formData.basicSalary ? Math.round(formData.basicSalary * 0.5) : '')}
                                            placeholder="0"
                                            onChange={(e) => setFormData({ ...formData, hraSalary: Number(e.target.value) })}
                                            className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-brand-text font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold uppercase text-brand-muted mb-1">Statutory Allowance (Manual)</label>
                                        <input
                                            type="number"
                                            name="convSalary"
                                            value={formData.convSalary || ''}
                                            placeholder="0"
                                            onChange={(e) => setFormData({ ...formData, convSalary: Number(e.target.value) })}
                                            className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-brand-text font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold uppercase text-sky-400 mb-1">PF (Provident Fund)</label>
                                        <input
                                            type="number"
                                            name="pfSalary"
                                            value={formData.pfSalary || ''}
                                            placeholder="0"
                                            onChange={(e) => setFormData({ ...formData, pfSalary: Number(e.target.value) })}
                                            className="w-full bg-brand-surface border border-sky-500/50 text-sky-400 rounded-xl p-3 font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold uppercase text-emerald-400 mb-1">ESI Contribution</label>
                                        <input
                                            type="number"
                                            name="esiSalary"
                                            value={formData.esiSalary || ''}
                                            placeholder="0"
                                            onChange={(e) => setFormData({ ...formData, esiSalary: Number(e.target.value) })}
                                            className="w-full bg-brand-surface border border-emerald-500/50 text-emerald-400 rounded-xl p-3 font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold uppercase text-amber-500 mb-1">
                                            {formData.engagementType === 'Employment' ? 'Monthly Salary (INR)' : 'Training Stipend (INR)'}
                                        </label>
                                        <input
                                            type="number"
                                            name="trainingSalary"
                                            value={formData.trainingSalary || ''}
                                            placeholder="0"
                                            onChange={(e) => setFormData({ ...formData, trainingSalary: Number(e.target.value) })}
                                            className="w-full bg-brand-surface border border-amber-500/50 text-amber-400 rounded-xl p-3 font-black text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Responsibilities */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Job Description & Responsibilities</label>
                                <textarea
                                    name="responsibilities"
                                    value={formData.responsibilities}
                                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                                    placeholder="Enter bulleted responsibilities (one per line)..."
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm min-h-[120px]"
                                />
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 rounded-2xl border border-brand-border text-brand-text font-bold hover:bg-brand-bg transition-colors active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 rounded-2xl bg-brand-primary text-white font-black hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                                >
                                    {isEditing ? 'Update Employee' : 'Save Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsProfileOpen(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-3xl border-2 border-white/40 shadow-xl">
                                    {selectedEmployee.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white leading-tight">{selectedEmployee.name}</h2>
                                    <p className="text-white/80 font-bold uppercase tracking-widest text-xs mt-1">{selectedEmployee.role}</p>
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className="bg-white/20 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-white/20">{selectedEmployee.id}</span>
                                        <span className="text-white/90 font-bold text-sm">{selectedEmployee.department}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsProfileOpen(false)} className="text-white/70 hover:text-white transition-colors">
                                <XCircle className="w-10 h-10" />
                            </button>
                        </div>

                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <h3 className="text-[10px] font-black uppercase text-brand-muted tracking-[0.2em] border-b border-brand-border pb-3">Personal Details</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="text-[10px] text-brand-muted uppercase font-black tracking-widest flex items-center gap-2 mb-2"><Mail className="w-3 h-3 text-brand-primary" /> Email</label>
                                            <p className="text-brand-text font-black text-sm break-all">{selectedEmployee.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-brand-muted uppercase font-black tracking-widest flex items-center gap-2 mb-2"><Phone className="w-3 h-3 text-brand-primary" /> Phone</label>
                                            <p className="text-brand-text font-black text-sm">{selectedEmployee.phone || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] text-brand-muted uppercase font-black tracking-widest flex items-center gap-2 mb-2"><Calendar className="w-3 h-3 text-brand-primary" /> Joined</label>
                                            <p className="text-brand-text font-black text-sm">{selectedEmployee.joiningDate}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-2">Status</label>
                                            <span className={`inline-block mt-1 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedEmployee.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                {selectedEmployee.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex justify-between items-center border-b border-brand-border pb-3">
                                    <h3 className="text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">Documents</h3>
                                    <button className="text-[10px] font-black uppercase tracking-wider text-brand-primary hover:underline">
                                        + Upload
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div
                                        onClick={() => openOfferLetter(selectedEmployee)}
                                        className="flex items-center justify-between p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 group hover:border-amber-500 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform text-amber-500">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-sm text-brand-text font-black block">Appointment_Offer_Letter.pdf</span>
                                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Click to View & Download</span>
                                            </div>
                                        </div>
                                        <button className="text-amber-500 hover:text-amber-400 p-2 rounded-lg bg-amber-500/10">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {['Resume.pdf', 'ID_Proof.jpg'].map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl border border-brand-border group hover:border-brand-primary/30 transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-brand-surface rounded-xl flex items-center justify-center border border-brand-border group-hover:scale-110 transition-transform">
                                                    <FileText className="w-5 h-5 text-brand-primary" />
                                                </div>
                                                <span className="text-sm text-brand-text font-bold">{doc}</span>
                                            </div>
                                            <button className="text-brand-muted hover:text-brand-text opacity-0 group-hover:opacity-100 transition-all active:scale-95">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Role & Responsibility Modal */}
            {isRoleModalOpen && selectedEmployeeForRole && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsRoleModalOpen(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-3xl p-5 md:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text">Role & Responsibilities</h2>
                                <p className="text-brand-muted text-xs font-bold uppercase mt-1">
                                    {selectedEmployeeForRole.name} ({selectedEmployeeForRole.id})
                                </p>
                            </div>
                            <button onClick={() => setIsRoleModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-colors text-brand-muted">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveRoleResponsibilities} className="space-y-6 text-left">
                            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-brand-muted font-semibold">Department:</span>
                                    <span className="text-brand-text font-bold">{selectedEmployeeForRole.department}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-brand-muted font-semibold">Current Role:</span>
                                    <span className="text-brand-text font-bold">{selectedEmployeeForRole.role}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Key Responsibilities</label>
                                <textarea
                                    value={roleResponsibilities}
                                    onChange={(e) => setRoleResponsibilities(e.target.value)}
                                    placeholder="Enter employee's key roles and responsibilities (e.g. key tasks, leadership scopes, etc.)..."
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium resize-none min-h-[150px]"
                                    required
                                />
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsRoleModalOpen(false)}
                                    className="flex-1 py-4 rounded-2xl border border-brand-border text-brand-text font-bold hover:bg-brand-bg transition-colors active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 rounded-2xl bg-brand-primary text-white font-black hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                                >
                                    Save Responsibilities
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Offer Letter View & Download Modal */}
            <OfferLetterModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                employee={selectedEmployeeForOffer}
                isNewProcess={isNewOfferProcess}
            />
        </div>
    );
};

export default Employees;
