import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Mail,
    Phone,
    Trash2,
    Edit2,
    Eye,
    XCircle,
    FileText,
    Calendar,
    Filter
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: string;
    joiningDate: string;
    phone?: string;
}

const Employees = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        role: '',
        department: '',
        status: 'Active',
        phone: '',
        joiningDate: ''
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/employees');
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

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
        setFormData({
            id: '',
            name: '',
            email: '',
            role: '',
            department: '',
            status: 'Active',
            phone: '',
            joiningDate: new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setIsEditing(true);
        setSelectedEmployee(employee);
        setFormData({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            department: employee.department,
            status: employee.status,
            phone: employee.phone || '',
            joiningDate: employee.joiningDate
        });
        setIsModalOpen(true);
    };

    const openProfile = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsProfileOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await fetch(`http://localhost:5000/api/employees/${id}`, { method: 'DELETE' });
                fetchEmployees();
            } catch (error) {
                console.error('Error deleting employee:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing && selectedEmployee
                ? `http://localhost:5000/api/employees/${selectedEmployee.id}`
                : 'http://localhost:5000/api/employees';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchEmployees();
            }
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };


    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Employee Management</h1>
                    <p className="text-brand-muted font-medium">Manage and monitor your workforce efficiently.</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        openAddModal();
                    }}
                    className="bg-brand-primary hover:opacity-90 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-primary/20 font-bold text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Employee
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-2xl py-3 pl-12 pr-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all font-medium placeholder:text-brand-muted/50"
                    />
                </div>
                <button className="bg-brand-surface border border-brand-border text-brand-text px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-brand-bg transition-colors font-bold text-sm shadow-sm">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            {/* Employee List - Table View */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-table-header border-b border-brand-border">
                            <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Employee</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Role & Dept</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Contact</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Joined</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {employees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-brand-bg transition-colors group cursor-pointer" onClick={() => openProfile(emp)}>
                                <td className="px-6 py-4">
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
                                <td className="px-6 py-4">
                                    <div className="text-brand-text font-bold text-sm">{emp.role}</div>
                                    <div className="text-brand-muted text-xs font-medium">{emp.department}</div>
                                </td>
                                <td className="px-6 py-4">
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
                                <td className="px-6 py-4">
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
                                <td className="px-6 py-4">
                                    <div className="text-brand-text text-sm font-medium">{emp.joiningDate}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
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
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
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
                                    <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest mb-2">Role</label>
                                    <input
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium"
                                        required
                                    />
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
                    <div className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
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
                                    {['Resume.pdf', 'ID_Proof.jpg', 'Offer_Letter.pdf'].map((doc, i) => (
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
        </div>
    );
};

export default Employees;
