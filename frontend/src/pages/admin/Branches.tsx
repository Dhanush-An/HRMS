import { useState, useEffect } from 'react';
import { 
    Building2, Search, Plus, Edit2, Trash2, 
    Users, Clock, ArrowLeft, LayoutGrid, List, 
    FileText, CheckCircle2, MapPin, CalendarDays, 
    Phone, Mail, ArrowRightLeft, ExternalLink, X,
    ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../api';

interface Branch {
    _id?: string;
    branchId: string;
    name: string;
    branchCode: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    managerName?: string;
    phone?: string;
    email?: string;
    subAdminEmail?: string;
    employeeStrength: number;
    openingDate?: string;
    latitude?: number;
    longitude?: number;
    branchType: 'Head Office' | 'Regional Office' | 'Franchise';
    status: 'Active' | 'Inactive';
}

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: string;
    phone: string;
    branchId: string;
    branchName: string;
}

interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName?: string;
    status: string;
}

interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    status: string;
}

const Branches = () => {
    // State management
    const [branches, setBranches] = useState<Branch[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null); // For branch dashboard view
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    
    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [formBranch, setFormBranch] = useState<Partial<Branch> | null>(null); // null means adding, object means editing
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferEmployee, setTransferEmployee] = useState<Employee | null>(null);
    const [targetBranchId, setTargetBranchId] = useState('');

    // Password fields
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Sub Admin Password fields
    const [subAdminPassword, setSubAdminPassword] = useState('');
    const [confirmSubAdminPassword, setConfirmSubAdminPassword] = useState('');
    const [showSubAdminPassword, setShowSubAdminPassword] = useState(false);
    const [showConfirmSubAdminPassword, setShowConfirmSubAdminPassword] = useState(false);

    const loadData = async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const [branchRes, empRes, leavesRes, attRes] = await Promise.all([
                api.get('/api/branches'),
                api.get('/api/employees'),
                api.get('/api/leaves'),
                api.get(`/api/attendance?date=${todayStr}`)
            ]);

            const branchData = await branchRes.json();
            const empData = await empRes.json();
            const leavesData = await leavesRes.json();
            const attData = await attRes.json();

            setBranches(Array.isArray(branchData) ? branchData : []);
            setEmployees(Array.isArray(empData) ? empData : []);
            setLeaves(Array.isArray(leavesData) ? leavesData : []);
            setAttendance(Array.isArray(attData) ? attData : []);
        } catch (error) {
            console.error("Error loading branch directory data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formBranch?.name || !formBranch?.branchCode) {
            alert("Name and Branch Code are required.");
            return;
        }

        if (password && password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (subAdminPassword && subAdminPassword !== confirmSubAdminPassword) {
            alert("Sub Admin Passwords do not match.");
            return;
        }

        try {
            const payload = { 
                ...formBranch, 
                password,
                subAdminPassword
            };
            if (formBranch.branchId) {
                // Edit branch
                const res = await api.put(`/api/branches/${formBranch.branchId}`, payload);
                if (res.ok) {
                    await loadData();
                    setShowFormModal(false);
                    // Update selected branch dashboard details if currently viewed
                    if (selectedBranch && selectedBranch.branchId === formBranch.branchId) {
                        const updated = await res.json();
                        setSelectedBranch(updated);
                    }
                } else {
                    const err = await res.json();
                    alert(`Failed to update branch: ${err.message || 'Unknown error'}`);
                }
            } else {
                // Add branch
                const res = await api.post('/api/branches', payload);
                if (res.ok) {
                    await loadData();
                    setShowFormModal(false);
                } else {
                    const err = await res.json();
                    alert(`Failed to register branch: ${err.message || 'Unknown error'}`);
                }
            }
        } catch (error: any) {
            console.error("Error saving branch:", error);
            alert(`Error: ${error.message || 'Unknown error occurred'}`);
        }
    };

    const handleDeleteBranch = async (branchId: string) => {
        const branchEmps = employees.filter(e => e.branchId === branchId);
        if (branchEmps.length > 0) {
            alert(`Access Denied: This branch has ${branchEmps.length} active employees. Please transfer all employees to another branch before deleting.`);
            return;
        }

        if (window.confirm("Are you sure you want to delete this branch? This action is permanent.")) {
            try {
                const res = await api.delete(`/api/branches/${branchId}`);
                if (res.ok) {
                    await loadData();
                    if (selectedBranch?.branchId === branchId) {
                        setSelectedBranch(null);
                    }
                }
            } catch (error) {
                console.error("Error deleting branch:", error);
            }
        }
    };

    const handleTransferEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferEmployee || !targetBranchId) return;

        const targetBranch = branches.find(b => b.branchId === targetBranchId);
        if (!targetBranch) return;

        try {
            const res = await api.put(`/api/employees/${transferEmployee.employeeId}`, {
                branchId: targetBranch.branchId,
                branchName: targetBranch.name
            });

            if (res.ok) {
                await loadData();
                setShowTransferModal(false);
                setTransferEmployee(null);
                setTargetBranchId('');
                alert(`Employee successfully transferred to ${targetBranch.name}.`);
            } else {
                const err = await res.json();
                alert(`Transfer failed: ${err.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error transferring employee:", error);
        }
    };

    // Filter branches list
    const filteredBranches = branches.filter(b => {
        const matchSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.managerName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchCity = cityFilter === 'All' || b.city === cityFilter;
        const matchStatus = statusFilter === 'All' || b.status === statusFilter;
        const matchType = typeFilter === 'All' || b.branchType === typeFilter;

        return matchSearch && matchCity && matchStatus && matchType;
    });

    // Unique cities for filter dropdown
    const citiesList = Array.from(new Set(branches.map(b => b.city).filter(Boolean)));

    // Calculate details for a specific branch (when clicked)
    const getBranchStats = (branchId: string) => {
        const branchEmployees = employees.filter(e => e.branchId === branchId);
        const empCount = branchEmployees.length;

        const empIds = branchEmployees.map(e => e.employeeId);
        const todayStr = new Date().toISOString().split('T')[0];
        
        const todayAttendance = attendance.filter(a => a.date === todayStr && empIds.includes(a.employeeId));
        const present = todayAttendance.filter(a => ['Present', 'Late', 'Half Day'].includes(a.status)).length;
        const absent = Math.max(empCount - present, 0);
        const late = todayAttendance.filter(a => a.status === 'Late').length;

        const pendingLeavesCount = leaves.filter(l => l.status === 'Pending' && empIds.includes(l.employeeId)).length;
        
        // Departments count
        const depts = Array.from(new Set(branchEmployees.map(e => e.department).filter(Boolean)));

        return {
            empCount,
            present,
            absent,
            late,
            pendingLeavesCount,
            deptCount: depts.length,
            depts
        };
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Conditional view: Branch Dashboard vs Directory List */}
            {selectedBranch ? (
                // DEDICATED BRANCH DASHBOARD
                <div className="space-y-8">
                    {/* Dashboard Header */}
                    <div className="flex flex-wrap items-center justify-between gap-6 border-b border-brand-border pb-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setSelectedBranch(null)}
                                className="w-10 h-10 flex items-center justify-center bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-primary rounded-2xl transition-all active:scale-90 hover:border-brand-primary/20"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">{selectedBranch.name}</h1>
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                        selectedBranch.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                    )}>{selectedBranch.status}</span>
                                </div>
                                <p className="text-brand-muted font-medium text-sm italic">
                                    {selectedBranch.branchType} · Code: {selectedBranch.branchCode} · Manager: {selectedBranch.managerName || 'Unassigned'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setFormBranch(selectedBranch);
                                    setPassword('');
                                    setConfirmPassword('');
                                    setShowFormModal(true);
                                }}
                                className="flex items-center gap-2 px-5 py-3 bg-brand-surface border border-brand-border text-brand-text hover:text-brand-primary hover:border-brand-primary/20 rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Branch Settings
                            </button>
                            <button
                                onClick={() => handleDeleteBranch(selectedBranch.branchId)}
                                className="flex items-center gap-2 px-5 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-sm shadow-rose-500/5"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Branch
                            </button>
                        </div>
                    </div>

                    {/* Stats Dashboard cards */}
                    {(() => {
                        const stats = getBranchStats(selectedBranch.branchId);
                        return (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                                    <div className="bg-brand-surface border border-brand-border rounded-[2rem] p-5 shadow-sm flex flex-col justify-between group">
                                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-brand-text tracking-tighter">{stats.empCount}</p>
                                            <p className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80 mt-1">Total Employees</p>
                                        </div>
                                    </div>

                                    <div className="bg-brand-surface border border-brand-border rounded-[2rem] p-5 shadow-sm flex flex-col justify-between group">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-brand-text tracking-tighter">{stats.present}</p>
                                            <p className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80 mt-1">Present Today</p>
                                        </div>
                                    </div>

                                    <div className="bg-brand-surface border border-brand-border rounded-[2rem] p-5 shadow-sm flex flex-col justify-between group">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <X className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-brand-text tracking-tighter">{stats.absent}</p>
                                            <p className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80 mt-1">Absent Today</p>
                                        </div>
                                    </div>

                                    <div className="bg-brand-surface border border-brand-border rounded-[2rem] p-5 shadow-sm flex flex-col justify-between group">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-brand-text tracking-tighter">{stats.late}</p>
                                            <p className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80 mt-1">Late Check-Ins</p>
                                        </div>
                                    </div>

                                    <div className="bg-brand-surface border border-brand-border rounded-[2rem] p-5 shadow-sm flex flex-col justify-between group">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-brand-text tracking-tighter">{stats.pendingLeavesCount}</p>
                                            <p className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black opacity-80 mt-1">Pending Leaves</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Operational & Departments Summary */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-sm space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-brand-text">Branch Metadata</h3>
                                        <div className="space-y-3.5 pt-2">
                                            <div className="flex items-center gap-3 text-sm text-brand-muted">
                                                <MapPin className="w-4.5 h-4.5 text-brand-primary" />
                                                <span>{selectedBranch.address || 'No Address'}, {selectedBranch.city}, {selectedBranch.state}, {selectedBranch.pincode}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-brand-muted">
                                                <Phone className="w-4.5 h-4.5 text-brand-primary" />
                                                <span>{selectedBranch.phone || 'No Contact Number'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-brand-muted">
                                                <Mail className="w-4.5 h-4.5 text-brand-primary" />
                                                <span>{selectedBranch.email || 'No Branch Email'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-brand-muted">
                                                <CalendarDays className="w-4.5 h-4.5 text-brand-primary" />
                                                <span>Established on {selectedBranch.openingDate || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-sm space-y-4 lg:col-span-2">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-brand-text">Active Departments ({stats.deptCount})</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5 pt-2">
                                            {stats.depts.length > 0 ? (
                                                stats.depts.map(dept => (
                                                    <span key={dept} className="px-4.5 py-2 bg-brand-bg border border-brand-border text-brand-text font-bold text-xs rounded-xl shadow-sm hover:border-brand-primary/20 hover:text-brand-primary transition-colors">
                                                        {dept}
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="text-xs text-brand-muted italic">No employees assigned to departments in this branch.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Employees roster for this branch */}
                                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] overflow-hidden shadow-sm">
                                    <div className="px-8 py-5 border-b border-brand-border bg-table-header flex justify-between items-center flex-wrap gap-4">
                                        <div>
                                            <h3 className="text-base font-black uppercase tracking-wider text-brand-text">Branch Roster</h3>
                                            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-0.5">List of all active personnel registered at this location</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-brand-border text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">
                                                    <th className="px-8 py-4.5">Employee Details</th>
                                                    <th className="px-8 py-4.5">Department & Role</th>
                                                    <th className="px-8 py-4.5">Contact Info</th>
                                                    <th className="px-8 py-4.5">Status</th>
                                                    <th className="px-8 py-4.5 text-right">Transfer</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-brand-border">
                                                {employees.filter(e => e.branchId === selectedBranch.branchId).map(emp => (
                                                    <tr key={emp.employeeId} className="hover:bg-brand-bg/40 transition-colors">
                                                        <td className="px-8 py-4 whitespace-nowrap">
                                                            <div className="text-brand-text font-black text-sm">{emp.name}</div>
                                                            <div className="text-brand-muted text-[10px] font-bold uppercase tracking-wide mt-0.5">{emp.employeeId}</div>
                                                        </td>
                                                        <td className="px-8 py-4 whitespace-nowrap">
                                                            <div className="text-brand-text font-bold text-xs uppercase">{emp.department}</div>
                                                            <div className="text-brand-muted text-[10px] mt-0.5 italic">{emp.role}</div>
                                                        </td>
                                                        <td className="px-8 py-4 whitespace-nowrap text-xs text-brand-muted font-medium">
                                                            <div>{emp.email}</div>
                                                            <div className="mt-0.5 font-mono">{emp.phone}</div>
                                                        </td>
                                                        <td className="px-8 py-4 whitespace-nowrap">
                                                            <span className={cn(
                                                                "px-2.5 py-0.5 inline-flex text-[9px] font-black rounded-full border uppercase tracking-widest",
                                                                emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                            )}>{emp.status}</span>
                                                        </td>
                                                        <td className="px-8 py-4 whitespace-nowrap text-right">
                                                            <button
                                                                onClick={() => {
                                                                    setTransferEmployee(emp);
                                                                    setTargetBranchId('');
                                                                    setShowTransferModal(true);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-white rounded-lg text-[10px] font-bold transition-all ml-auto hover:scale-105"
                                                            >
                                                                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {employees.filter(e => e.branchId === selectedBranch.branchId).length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-8 py-12 text-center text-brand-muted text-sm italic">
                                                            No personnel registered to this branch directory yet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            ) : (
                // BRANCHES DIRECTORY LIST
                <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Directory Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">
                        <div>
                            <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Branch Directory</h1>
                            <p className="text-brand-muted font-medium text-sm italic">Manage global multi-branch network and visualize localized operations.</p>
                        </div>
                        <button
                            onClick={() => {
                                setFormBranch({
                                    branchType: 'Regional Office',
                                    status: 'Active',
                                    employeeStrength: 0
                                });
                                setPassword('');
                                setConfirmPassword('');
                                setSubAdminPassword('');
                                setConfirmSubAdminPassword('');
                                setShowSubAdminPassword(false);
                                setShowConfirmSubAdminPassword(false);
                                setShowFormModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-primary/20 border-t border-white/20"
                        >
                            <Plus className="w-4 h-4" /> Add Branch
                        </button>
                    </div>

                    {/* Filters & Control bar */}
                    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-sm space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Search */}
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                                <input
                                    type="text"
                                    placeholder="Search branches..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 pl-10 pr-4 text-brand-text placeholder-brand-muted text-xs font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                />
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex bg-brand-bg p-1.5 rounded-2xl border border-brand-border shadow-inner">
                                    <button 
                                        onClick={() => setViewMode('grid')}
                                        className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-brand-surface text-brand-primary shadow-sm" : "text-brand-muted hover:text-brand-text")}
                                    >
                                        <LayoutGrid className="w-4.5 h-4.5" />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('table')}
                                        className={cn("p-2 rounded-xl transition-all", viewMode === 'table' ? "bg-brand-surface text-brand-primary shadow-sm" : "text-brand-muted hover:text-brand-text")}
                                    >
                                        <List className="w-4.5 h-4.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter Selects */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-brand-border/50 border-dashed">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-2 block">City / Metro</label>
                                <select 
                                    value={cityFilter}
                                    onChange={e => setCityFilter(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-brand-text focus:outline-none cursor-pointer"
                                >
                                    <option value="All">All Cities</option>
                                    {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-2 block">Operations Type</label>
                                <select 
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-brand-text focus:outline-none cursor-pointer"
                                >
                                    <option value="All">All Types</option>
                                    <option value="Head Office">Head Office</option>
                                    <option value="Regional Office">Regional Office</option>
                                    <option value="Franchise">Franchise</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-2 block">Status Node</label>
                                <select 
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-brand-text focus:outline-none cursor-pointer"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Directory Cards/Table Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* Card Grid Layout */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredBranches.map(branch => {
                                const stats = getBranchStats(branch.branchId);
                                return (
                                    <div 
                                        key={branch.branchId} 
                                        onClick={() => setSelectedBranch(branch)}
                                        className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-sm hover:border-brand-primary/40 hover:shadow-md cursor-pointer transition-all duration-300 group relative flex flex-col justify-between h-[300px]"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner",
                                                    branch.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                )}>{branch.status}</span>
                                            </div>

                                            <h3 className="text-lg font-black text-brand-text group-hover:text-brand-primary transition-colors uppercase truncate">{branch.name}</h3>
                                            <p className="text-brand-muted text-xs font-semibold mt-1 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-brand-primary/70" />
                                                {branch.city || 'No Location'}, {branch.state || 'N/A'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 py-4.5 my-3 border-y border-brand-border border-dashed text-center">
                                            <div>
                                                <span className="text-[10px] text-brand-muted uppercase font-black tracking-widest block mb-0.5">Staff</span>
                                                <span className="text-brand-text font-black text-sm">{stats.empCount}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-brand-muted uppercase font-black tracking-widest block mb-0.5">Depts</span>
                                                <span className="text-brand-text font-black text-sm">{stats.deptCount}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-brand-muted uppercase font-black tracking-widest block mb-0.5">Leaves</span>
                                                <span className="text-brand-text font-black text-sm">{stats.pendingLeavesCount}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] italic">{branch.branchType}</span>
                                            <div className="flex items-center gap-1.5 text-xs text-brand-primary font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                                Go Dashboard <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredBranches.length === 0 && (
                                <div className="col-span-full bg-brand-surface border border-brand-border rounded-[2.5rem] py-20 text-center text-brand-muted italic">
                                    No branches found matching directories filters.
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Table View Layout */
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-table-header border-b border-brand-border text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">
                                            <th className="px-8 py-5">Branch Code / ID</th>
                                            <th className="px-8 py-5">Branch Name</th>
                                            <th className="px-8 py-5">Location</th>
                                            <th className="px-8 py-5">Manager</th>
                                            <th className="px-8 py-5">Employees</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border">
                                        {filteredBranches.map(branch => {
                                            const stats = getBranchStats(branch.branchId);
                                            return (
                                                <tr key={branch.branchId} className="hover:bg-brand-bg/40 transition-colors group">
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="text-brand-text font-black text-sm uppercase">{branch.branchCode}</div>
                                                        <div className="text-[10px] text-brand-muted mt-0.5 uppercase tracking-wide">ID: {branch.branchId}</div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div 
                                                            onClick={() => setSelectedBranch(branch)}
                                                            className="text-brand-text font-black text-sm group-hover:text-brand-primary cursor-pointer transition-colors"
                                                        >
                                                            {branch.name}
                                                        </div>
                                                        <div className="text-[10px] text-brand-muted mt-0.5 italic">{branch.branchType}</div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-xs text-brand-muted font-medium">
                                                        {branch.city}, {branch.state}
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-xs text-brand-text font-bold">
                                                        {branch.managerName || 'Unassigned'}
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-brand-text font-black text-sm">
                                                        {stats.empCount}
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <span className={cn(
                                                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                            branch.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                        )}>{branch.status}</span>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setSelectedBranch(branch)}
                                                                className="bg-brand-bg text-brand-muted hover:bg-brand-primary/10 hover:text-brand-primary p-2.5 rounded-xl border border-brand-border hover:border-brand-primary/30 transition-all active:scale-95"
                                                                title="View Branch Dashboard"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setFormBranch(branch);
                                                                    setPassword('');
                                                                    setConfirmPassword('');
                                                                    setSubAdminPassword('');
                                                                    setConfirmSubAdminPassword('');
                                                                    setShowSubAdminPassword(false);
                                                                    setShowConfirmSubAdminPassword(false);
                                                                    setShowFormModal(true);
                                                                }}
                                                                className="bg-brand-bg text-brand-muted hover:bg-brand-primary/10 hover:text-brand-primary p-2.5 rounded-xl border border-brand-border hover:border-brand-primary/30 transition-all active:scale-95"
                                                                title="Edit settings"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBranch(branch.branchId)}
                                                                className="bg-brand-bg text-brand-muted hover:bg-rose-500 hover:text-white p-2.5 rounded-xl border border-brand-border hover:border-rose-500 transition-all active:scale-95"
                                                                title="Delete Branch"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredBranches.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-10 text-center text-brand-muted text-sm italic">
                                                    No branches found matching directories filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* BRANCH FORM MODAL (Add & Edit) */}
            {showFormModal && formBranch && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-2xl p-5 md:p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative group/modal max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text tracking-tighter uppercase">{formBranch.branchId ? 'Modify Branch' : 'Register Branch'}</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em]">HRMS Node Network Settings</p>
                            </div>
                            <button
                                onClick={() => setShowFormModal(false)}
                                className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-brand-primary transition-all active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Branch Name</label>
                                    <input 
                                        type="text" required placeholder="e.g. Chennai Head Office"
                                        value={formBranch.name || ''}
                                        onChange={e => setFormBranch({...formBranch, name: e.target.value})}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Branch Code</label>
                                    <input 
                                        type="text" required placeholder="e.g. CHE01"
                                        value={formBranch.branchCode || ''}
                                        onChange={e => setFormBranch({...formBranch, branchCode: e.target.value})}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Branch Type</label>
                                    <select
                                        value={formBranch.branchType || 'Regional Office'}
                                        onChange={e => setFormBranch({...formBranch, branchType: e.target.value as any})}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                    >
                                        <option value="Head Office">Head Office</option>
                                        <option value="Regional Office">Regional Office</option>
                                        <option value="Franchise">Franchise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Status</label>
                                    <select
                                        value={formBranch.status || 'Active'}
                                        onChange={e => setFormBranch({...formBranch, status: e.target.value as any})}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-brand-border/50 border-dashed pt-4 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-brand-text">Local Leadership & Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Branch Manager Name</label>
                                        <input 
                                            type="text" placeholder="e.g. John Doe"
                                            value={formBranch.managerName || ''}
                                            onChange={e => setFormBranch({...formBranch, managerName: e.target.value})}
                                            className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Contact Phone</label>
                                        <input 
                                            type="text" placeholder="e.g. +91 98765..."
                                            value={formBranch.phone || ''}
                                            onChange={e => setFormBranch({...formBranch, phone: e.target.value})}
                                            className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-brand-border/50 border-dashed pt-4 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-brand-text">Branch Sub Admin (Branch Admin) Account</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Sub Admin Email</label>
                                        <input 
                                            type="email" placeholder="e.g. subadmin.chennai@hrms.com"
                                            value={formBranch.subAdminEmail || ''}
                                            onChange={e => setFormBranch({...formBranch, subAdminEmail: e.target.value})}
                                            className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-brand-border/30 pt-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Sub Admin Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showSubAdminPassword ? "text" : "password"} 
                                                placeholder={formBranch.branchId ? "Leave blank to keep existing password" : "Enter password..."}
                                                value={subAdminPassword}
                                                onChange={e => setSubAdminPassword(e.target.value)}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 pr-10 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSubAdminPassword(!showSubAdminPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text"
                                            >
                                                {showSubAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Confirm Sub Admin Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showConfirmSubAdminPassword ? "text" : "password"} 
                                                placeholder="Confirm password..."
                                                value={confirmSubAdminPassword}
                                                onChange={e => setConfirmSubAdminPassword(e.target.value)}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 pr-10 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmSubAdminPassword(!showConfirmSubAdminPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text"
                                            >
                                                {showConfirmSubAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-brand-border/50 border-dashed pt-4 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-brand-text">Geography & Localization</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Street Address</label>
                                        <input 
                                            type="text" placeholder="Street Name, Building Name..."
                                            value={formBranch.address || ''}
                                            onChange={e => setFormBranch({...formBranch, address: e.target.value})}
                                            className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-medium text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">City</label>
                                            <input 
                                                type="text" placeholder="e.g. Bangalore"
                                                value={formBranch.city || ''}
                                                onChange={e => setFormBranch({...formBranch, city: e.target.value})}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">State / Province</label>
                                            <input 
                                                type="text" placeholder="e.g. Karnataka"
                                                value={formBranch.state || ''}
                                                onChange={e => setFormBranch({...formBranch, state: e.target.value})}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Country</label>
                                            <input 
                                                type="text" placeholder="e.g. India"
                                                value={formBranch.country || ''}
                                                onChange={e => setFormBranch({...formBranch, country: e.target.value})}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Pincode</label>
                                            <input 
                                                type="text" placeholder="e.g. 560001"
                                                value={formBranch.pincode || ''}
                                                onChange={e => setFormBranch({...formBranch, pincode: e.target.value})}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Opening Date</label>
                                            <input 
                                                type="date"
                                                value={formBranch.openingDate || ''}
                                                onChange={e => setFormBranch({...formBranch, openingDate: e.target.value})}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Latitude</label>
                                            <input 
                                                type="number" step="any" placeholder="e.g. 12.9716"
                                                value={formBranch.latitude || ''}
                                                onChange={e => setFormBranch({...formBranch, latitude: parseFloat(e.target.value)})}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 pl-1">Longitude</label>
                                            <input 
                                                type="number" step="any" placeholder="e.g. 77.5946"
                                                value={formBranch.longitude || ''}
                                                onChange={e => setFormBranch({...formBranch, longitude: parseFloat(e.target.value)})}
                                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/30 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-brand-border/50 border-dashed">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="flex-1 py-4 bg-brand-bg text-brand-muted rounded-2xl font-black text-[10px] uppercase tracking-widest border border-brand-border hover:bg-brand-surface hover:text-brand-text transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all border-t border-white/20"
                                >
                                    Confirm Register Node
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EMPLOYEE TRANSFER MODAL */}
            {showTransferModal && transferEmployee && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-md p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-black text-brand-text tracking-tighter uppercase">Transfer Employee</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em]">Inter-Branch Node Relocation</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowTransferModal(false);
                                    setTransferEmployee(null);
                                }}
                                className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-brand-primary transition-all active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleTransferEmployee} className="space-y-6 pt-2">
                            <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border border-dashed space-y-1">
                                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Selected Personnel</p>
                                <p className="text-sm font-black text-brand-text">{transferEmployee.name}</p>
                                <p className="text-xs text-brand-muted">ID: {transferEmployee.employeeId} · Current: {transferEmployee.branchName}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">Target Branch</label>
                                <select 
                                    required
                                    value={targetBranchId}
                                    onChange={e => setTargetBranchId(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/30 cursor-pointer outline-none"
                                >
                                    <option value="">Select Destination Branch</option>
                                    {branches.filter(b => b.branchId !== transferEmployee.branchId && b.status === 'Active').map(b => (
                                        <option key={b.branchId} value={b.branchId}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTransferModal(false);
                                        setTransferEmployee(null);
                                    }}
                                    className="flex-1 py-4 bg-brand-bg text-brand-muted rounded-2xl font-black text-[10px] uppercase tracking-widest border border-brand-border hover:bg-brand-surface transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all border-t border-white/20"
                                >
                                    Transfer Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Branches;
