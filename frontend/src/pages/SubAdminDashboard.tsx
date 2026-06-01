import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar, Clock, DollarSign,
  Receipt, Megaphone, LogOut, Menu, X, CheckCircle,
  XCircle, Search, Building2, UserCheck, Plus, RefreshCw,
  Trash2, Edit2, Eye, EyeOff
} from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

// ── helpers ──────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token') || '';
const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); }
  catch { return {}; }
};

const apiFetch = async (path: string, opts: RequestInit = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) }
  });
  return res.json();
};

// ── colour helpers ────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  Pending:  'bg-amber-500/15  text-amber-400  border border-amber-500/30',
  Approved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Rejected: 'bg-red-500/15    text-red-400    border border-red-500/30',
  Active:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Inactive: 'bg-red-500/15    text-red-400    border border-red-500/30',
  Present:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Absent:   'bg-red-500/15    text-red-400    border border-red-500/30',
  'Half Day':'bg-amber-500/15  text-amber-400  border border-amber-500/30',
  Leave:    'bg-blue-500/15   text-blue-400   border border-blue-500/30',
};

// ── OVERVIEW ─────────────────────────────────────────────────────────────────
const OverviewSection: React.FC<{
  employees: any[]; attendance: any[]; leaves: any[]; expenses: any[]; branchName: string;
}> = ({ employees, attendance, leaves, expenses, branchName }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayAtt = attendance.filter(a => a.date === today);
  const presentToday  = todayAtt.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
  const pendingLeaves  = leaves.filter(l => l.status === 'Pending').length;
  const pendingExpenses = expenses.filter(e => e.status === 'Pending').length;

  const cards = [
    { label: 'Total Employees', value: employees.length, icon: Users,       color: 'from-violet-600 to-purple-600',   shadow: 'shadow-violet-500/20' },
    { label: 'Present Today',   value: presentToday,     icon: UserCheck,    color: 'from-emerald-600 to-teal-600',   shadow: 'shadow-emerald-500/20' },
    { label: 'Pending Leaves',  value: pendingLeaves,    icon: Calendar,     color: 'from-amber-500 to-orange-600',   shadow: 'shadow-amber-500/20' },
    { label: 'Pending Expenses',value: pendingExpenses,  icon: Receipt,      color: 'from-blue-600 to-cyan-600',      shadow: 'shadow-blue-500/20' },
  ];

  const recentLeaves   = [...leaves].sort((a,b)=> new Date(b.appliedOn||b.createdAt).getTime() - new Date(a.appliedOn||a.createdAt).getTime()).slice(0,5);
  const recentAttendance = todayAtt.slice(0,8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">{branchName} — Overview</h2>
        <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c,i) => (
          <motion.div key={c.label} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
            className={`relative overflow-hidden bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl ${c.shadow}`}>
            <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-xl`} />
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4 shadow-lg ${c.shadow}`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-bold text-white">{c.value}</div>
            <div className="text-slate-400 text-sm mt-1">{c.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Today's Attendance */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-400"/>Today's Attendance</h3>
          {recentAttendance.length === 0
            ? <p className="text-slate-500 text-sm text-center py-6">No attendance records for today</p>
            : <div className="space-y-2">
                {recentAttendance.map((a,i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{a.employeeName || a.employeeId}</p>
                      <p className="text-slate-400 text-xs">In: {a.checkIn || '—'}  |  Out: {a.checkOut || '—'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status] || ''}`}>{a.status}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-400"/>Recent Leave Requests</h3>
          {recentLeaves.length === 0
            ? <p className="text-slate-500 text-sm text-center py-6">No leave requests</p>
            : <div className="space-y-2">
                {recentLeaves.map((l,i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{l.employeeName || l.employeeId}</p>
                      <p className="text-slate-400 text-xs">{l.type} · {l.startDate} → {l.endDate}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[l.status] || ''}`}>{l.status}</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
};

// ── EMPLOYEES ────────────────────────────────────────────────────────────────
const EmployeesSection: React.FC<{ employees: any[]; onRefresh: ()=>void }> = ({ employees, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    role: 'employee',
    department: '',
    status: 'Active',
    phone: '',
    joiningDate: new Date().toISOString().split('T')[0],
    username: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedEmployee(null);
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      role: 'employee',
      department: '',
      status: 'Active',
      phone: '',
      joiningDate: new Date().toISOString().split('T')[0],
      username: '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: any) => {
    setIsEditing(true);
    setSelectedEmployee(emp);
    setFormData({
      employeeId: emp.employeeId || emp.id || '',
      name: emp.name || '',
      email: emp.email || '',
      role: emp.role || 'employee',
      department: emp.department || '',
      status: emp.status || 'Active',
      phone: emp.phone || '',
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      username: emp.username || emp.email || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (empId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const res = await fetch(`${API_URL}/api/employees/${empId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (res.ok) {
          onRefresh();
        } else {
          alert(data.message || 'Error deleting employee');
        }
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing && selectedEmployee
        ? `${API_URL}/api/employees/${selectedEmployee.employeeId || selectedEmployee.id}`
        : `${API_URL}/api/employees`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        id: formData.employeeId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.trim(),
        department: formData.department.trim(),
        status: formData.status,
        phone: formData.phone.trim(),
        joiningDate: formData.joiningDate,
        username: formData.username.trim() || formData.email.trim(),
        password: formData.password
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        onRefresh();
      } else {
        alert(data.message || 'Error saving employee');
      }
    } catch (error: any) {
      alert(`Error saving employee: ${error.message || 'Unknown error'}`);
    }
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = (e.name||'').toLowerCase().includes(q) || (e.email||'').toLowerCase().includes(q) || (e.employeeId||'').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Employees</h2>
          <p className="text-slate-400 text-sm">{employees.length} employees in your branch</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4"/> Add Employee
          </button>
          <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-700/50">
            <RefreshCw className="w-4 h-4"/> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email or ID…"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors">
          {['All','Active','Inactive'].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Employee','ID','Department','Role','Status','Actions'].map(h=>(
                  <th key={h} className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} className="text-center text-slate-500 py-12">No employees found</td></tr>
                : filtered.map((emp,i) => (
                  <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(emp.name||'?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{emp.name}</p>
                          <p className="text-slate-400 text-xs">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{emp.employeeId}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{emp.department || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 font-medium capitalize">{emp.role || 'employee'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[emp.status] || ''}`}>{emp.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={()=>openEditModal(emp)} className="p-1.5 bg-slate-700/50 hover:bg-violet-600/20 text-slate-400 hover:text-violet-400 rounded-lg transition-colors border border-slate-650" title="Edit">
                          <Edit2 className="w-4 h-4"/>
                        </button>
                        <button onClick={()=>handleDelete(emp.employeeId || emp.id)} className="p-1.5 bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-slate-650" title="Delete">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-2xl text-white shadow-2xl relative overflow-y-auto max-h-[90vh]">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{isEditing ? 'Edit Employee' : 'Add New Employee'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter full name"
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Employee ID</label>
                    <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} required={!isEditing} disabled={isEditing} placeholder="EMP001"
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Email Address</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="email@company.com"
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Phone Number</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="10-digit number" pattern="[0-9]{10}" maxLength={10}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Department</label>
                    <input name="department" value={formData.department} onChange={handleInputChange} required placeholder="e.g. Engineering"
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Role</label>
                    <input name="role" value={formData.role} onChange={handleInputChange} required placeholder="e.g. employee"
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Joining Date</label>
                    <input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleInputChange} required
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>

                {!isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Username</label>
                      <input name="username" value={formData.username} onChange={handleInputChange} placeholder="Custom username (optional)"
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Password</label>
                      <div className="relative">
                        <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} required placeholder="••••••••"
                          className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-4 pr-10 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 justify-end">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
                    {isEditing ? 'Update Employee' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── ATTENDANCE ───────────────────────────────────────────────────────────────
const AttendanceSection: React.FC<{ attendance: any[]; employees: any[] }> = ({ attendance, employees }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const filtered = attendance.filter(a => {
    if (a.date !== date) return false;
    const q = search.toLowerCase();
    return !q || (a.employeeName||'').toLowerCase().includes(q) || (a.employeeId||'').toLowerCase().includes(q);
  });

  const statCounts = {
    Present: filtered.filter(a=>a.status==='Present').length,
    Absent:  employees.length - filtered.length,
    'Half Day': filtered.filter(a=>a.status==='Half Day').length,
    Leave:   filtered.filter(a=>a.status==='Leave').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Attendance</h2>
        <p className="text-slate-400 text-sm">Monitor daily branch attendance</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(statCounts).map(([label,val])=>(
          <div key={label} className={`rounded-xl p-4 border ${statusColor[label]||'bg-slate-800/60 border-slate-700/50'}`}>
            <div className="text-2xl font-bold text-white">{val < 0 ? 0 : val}</div>
            <div className="text-xs mt-1 opacity-80">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"/>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee…"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"/>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Employee','Date','Check In','Check Out','Status','Hours'].map(h=>(
                  <th key={h} className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} className="text-center text-slate-500 py-12">No attendance records for {date}</td></tr>
                : filtered.map((a,i)=>(
                  <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm font-medium">{a.employeeName || a.employeeId}</p>
                      <p className="text-slate-400 text-xs">{a.employeeId}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{a.date}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{a.checkIn || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{a.checkOut || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[a.status]||''}`}>{a.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{a.totalHours ? `${a.totalHours}h` : '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── LEAVES ───────────────────────────────────────────────────────────────────
const LeavesSection: React.FC<{ leaves: any[]; onRefresh: ()=>void }> = ({ leaves, onRefresh }) => {
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState<string|null>(null);
  const [localLeaves, setLocalLeaves] = useState(leaves);

  useEffect(()=>{ setLocalLeaves(leaves); },[leaves]);

  const filtered = localLeaves.filter(l => filter === 'All' || l.status === filter);

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    try {
      await apiFetch(`/api/leaves/${id}`, { method:'PUT', body: JSON.stringify({ status }) });
      setLocalLeaves(prev => prev.map(l => l._id===id ? {...l, status} : l));
      onRefresh();
    } finally { setLoading(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Leave Requests</h2>
          <p className="text-slate-400 text-sm">{leaves.filter(l=>l.status==='Pending').length} pending approvals</p>
        </div>
        <div className="flex gap-2">
          {['All','Pending','Approved','Rejected'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===s ? 'bg-violet-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0
          ? <div className="text-center text-slate-500 py-16 bg-slate-800/40 rounded-2xl">No {filter.toLowerCase()} leave requests</div>
          : filtered.map((l,i)=>(
            <motion.div key={l._id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
              className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(l.employeeName||'?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium">{l.employeeName || l.employeeId}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[l.status]||''}`}>{l.status}</span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">{l.type} · {l.startDate} → {l.endDate}</p>
                {l.reason && <p className="text-slate-500 text-xs mt-1 truncate">{l.reason}</p>}
              </div>
              {l.status === 'Pending' && (
                <div className="flex gap-2">
                  <button disabled={loading===l._id} onClick={()=>updateStatus(l._id,'Approved')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4"/> Approve
                  </button>
                  <button disabled={loading===l._id} onClick={()=>updateStatus(l._id,'Rejected')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                    <XCircle className="w-4 h-4"/> Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))
        }
      </div>
    </div>
  );
};

// ── EXPENSES ─────────────────────────────────────────────────────────────────
const ExpensesSection: React.FC<{ expenses: any[]; onRefresh: ()=>void }> = ({ expenses, onRefresh }) => {
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState<string|null>(null);
  const [localExp, setLocalExp] = useState(expenses);

  useEffect(()=>{ setLocalExp(expenses); },[expenses]);

  const filtered = localExp.filter(e => filter === 'All' || e.status === filter);

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    try {
      await apiFetch(`/api/expenses/${id}/status`, { method:'PUT', body: JSON.stringify({ status }) });
      setLocalExp(prev => prev.map(e => e._id===id ? {...e, status} : e));
      onRefresh();
    } finally { setLoading(null); }
  };

  const totalPending  = localExp.filter(e=>e.status==='Pending').reduce((s,e)=>s+Number(e.amount||0),0);
  const totalApproved = localExp.filter(e=>e.status==='Approved').reduce((s,e)=>s+Number(e.amount||0),0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Expense Claims</h2>
          <p className="text-slate-400 text-sm">{localExp.filter(e=>e.status==='Pending').length} pending · ₹{totalApproved.toLocaleString()} approved this month</p>
        </div>
        <div className="flex gap-2">
          {['All','Pending','Approved','Rejected'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===s ? 'bg-violet-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="text-amber-400 text-xs font-medium uppercase tracking-wide mb-1">Pending Amount</div>
          <div className="text-2xl font-bold text-white">₹{totalPending.toLocaleString()}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-emerald-400 text-xs font-medium uppercase tracking-wide mb-1">Approved Amount</div>
          <div className="text-2xl font-bold text-white">₹{totalApproved.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0
          ? <div className="text-center text-slate-500 py-16 bg-slate-800/40 rounded-2xl">No {filter.toLowerCase()} expense claims</div>
          : filtered.map((exp,i)=>(
            <motion.div key={exp._id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
              className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(exp.employeeName||'?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium">{exp.employeeName || exp.employeeId}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[exp.status]||''}`}>{exp.status}</span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">{exp.category} · {exp.date}</p>
                {exp.description && <p className="text-slate-500 text-xs mt-1 truncate">{exp.description}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-white font-bold text-lg">₹{Number(exp.amount||0).toLocaleString()}</div>
              </div>
              {exp.status === 'Pending' && (
                <div className="flex gap-2">
                  <button disabled={loading===exp._id} onClick={()=>updateStatus(exp._id,'Approved')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4"/> Approve
                  </button>
                  <button disabled={loading===exp._id} onClick={()=>updateStatus(exp._id,'Rejected')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                    <XCircle className="w-4 h-4"/> Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))
        }
      </div>
    </div>
  );
};

// ── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
const AnnouncementsSection: React.FC<{ branchName: string }> = ({ branchName }) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', message:'', priority:'Normal' });
  const [loading, setLoading] = useState(false);

  const fetchAnn = useCallback(async () => {
    const data = await apiFetch('/api/announcements');
    setAnnouncements(Array.isArray(data) ? data.reverse() : []);
  }, []);

  useEffect(()=>{ fetchAnn(); },[fetchAnn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/announcements', { method:'POST', body: JSON.stringify({...form, branch: branchName}) });
      setForm({ title:'', message:'', priority:'Normal' });
      setShowForm(false);
      fetchAnn();
    } finally { setLoading(false); }
  };

  const priorityColor: Record<string,string> = {
    High:   'bg-red-500/15 text-red-400 border border-red-500/30',
    Normal: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    Low:    'bg-slate-500/15 text-slate-400 border border-slate-600/30',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Announcements</h2>
          <p className="text-slate-400 text-sm">Post updates for your branch employees</p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/> New
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={submit} initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
            className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4 overflow-hidden">
            <h3 className="text-white font-semibold">New Announcement</h3>
            <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Title"
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"/>
            <textarea required rows={3} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Message…"
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 resize-none"/>
            <div className="flex items-center gap-3">
              <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}
                className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500">
                {['Normal','High','Low'].map(p=><option key={p}>{p}</option>)}
              </select>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                {loading ? 'Posting…' : 'Post Announcement'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {announcements.length === 0
          ? <div className="text-center text-slate-500 py-16 bg-slate-800/40 rounded-2xl">No announcements yet</div>
          : announcements.map((ann,i)=>(
            <motion.div key={ann._id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
              className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-white font-semibold">{ann.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[ann.priority]||priorityColor['Normal']}`}>{ann.priority||'Normal'}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{ann.message}</p>
                  <p className="text-slate-500 text-xs mt-2">{ann.date} {ann.branch && `· ${ann.branch}`}</p>
                </div>
              </div>
            </motion.div>
          ))
        }
      </div>
    </div>
  );
};

// ── PAYROLL ───────────────────────────────────────────────────────────────────
const PayrollSection: React.FC<{ employees: any[] }> = ({ employees }) => {
  const totalBase = employees.reduce((s,e)=>s+Number(e.salary?.base||0),0);
  const totalHRA  = employees.reduce((s,e)=>s+Number(e.salary?.hra||0),0);
  const totalNet  = employees.reduce((s,e)=>s+Number(e.salary?.base||0)+Number(e.salary?.hra||0)+Number(e.salary?.transport||0)+Number(e.salary?.other||0),0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Payroll Overview</h2>
        <p className="text-slate-400 text-sm">Branch salary summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label:'Total Base', value:`₹${totalBase.toLocaleString()}`, color:'from-violet-600 to-purple-600' },
          { label:'Total HRA', value:`₹${totalHRA.toLocaleString()}`, color:'from-blue-600 to-cyan-600' },
          { label:'Total Net Pay', value:`₹${totalNet.toLocaleString()}`, color:'from-emerald-600 to-teal-600' },
        ].map(c=>(
          <div key={c.label} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.label}</div>
            <div className="text-3xl font-bold text-white">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Employee','Department','Base','HRA','Transport','Other','Net Pay'].map(h=>(
                  <th key={h} className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.filter(e=>e.role==='employee'||e.role==='staff').map((emp,i)=>{
                const s = emp.salary || {};
                const net = Number(s.base||0)+Number(s.hra||0)+Number(s.transport||0)+Number(s.other||0);
                return (
                  <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm font-medium">{emp.name}</p>
                      <p className="text-slate-400 text-xs">{emp.employeeId}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{emp.department||'—'}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">₹{Number(s.base||0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">₹{Number(s.hra||0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">₹{Number(s.transport||0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">₹{Number(s.other||0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-semibold text-sm">₹{net.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
type Section = 'overview' | 'employees' | 'attendance' | 'leaves' | 'payroll' | 'expenses' | 'announcements';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview',      label: 'Overview',      icon: LayoutDashboard },
  { id: 'employees',     label: 'Employees',      icon: Users           },
  { id: 'attendance',    label: 'Attendance',     icon: Clock           },
  { id: 'leaves',        label: 'Leaves',         icon: Calendar        },
  { id: 'payroll',       label: 'Payroll',        icon: DollarSign      },
  { id: 'expenses',      label: 'Expenses',       icon: Receipt         },
  { id: 'announcements', label: 'Announcements',  icon: Megaphone       },
];

const SubAdminDashboard: React.FC = () => {
  const navigate    = useNavigate();
  const user        = getUser();
  const branchName  = user.branchName  || 'Branch';
  const branchId    = user.branchId    || '';

  const [active, setActive]       = useState<Section>('overview');
  const [sidebarOpen, setSidebar] = useState(false);
  const [employees,   setEmployees]   = useState<any[]>([]);
  const [attendance,  setAttendance]  = useState<any[]>([]);
  const [leaves,      setLeaves]      = useState<any[]>([]);
  const [expenses,    setExpenses]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, att, lvs, exps] = await Promise.all([
        apiFetch('/api/employees'),
        apiFetch('/api/attendance'),
        apiFetch('/api/leaves'),
        apiFetch('/api/expenses'),
      ]);
      setEmployees(Array.isArray(emps) ? emps : []);
      setAttendance(Array.isArray(att) ? att : []);
      setLeaves(Array.isArray(lvs) ? lvs : []);
      setExpenses(Array.isArray(exps) ? exps : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex font-sans">
      {/* ── Sidebar Overlay (mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={()=>setSidebar(false)}/>
        )}
      </AnimatePresence>

      {/* ── Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-40 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Brand */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white"/>
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-sm truncate">{branchName}</div>
              <div className="text-violet-400 text-xs">Sub Admin Portal</div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(user.name||'S')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name || 'Sub Admin'}</p>
              <p className="text-slate-400 text-xs truncate">{user.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={()=>{ setActive(item.id); setSidebar(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${active===item.id
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}>
              <item.icon className="w-4 h-4 flex-shrink-0"/>
              {item.label}
              {item.id==='leaves' && leaves.filter(l=>l.status==='Pending').length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {leaves.filter(l=>l.status==='Pending').length}
                </span>
              )}
              {item.id==='expenses' && expenses.filter(e=>e.status==='Pending').length > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {expenses.filter(e=>e.status==='Pending').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
            <LogOut className="w-4 h-4"/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={()=>setSidebar(v=>!v)} className="lg:hidden w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
            <Menu className="w-5 h-5"/>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base truncate">
              {NAV_ITEMS.find(n=>n.id===active)?.label}
            </h1>
            <p className="text-slate-400 text-xs">{branchName} · Branch ID: {branchId}</p>
          </div>
          <button onClick={fetchAll} className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {loading
            ? <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            : (
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:0.15}}>
                  {active === 'overview'      && <OverviewSection employees={employees} attendance={attendance} leaves={leaves} expenses={expenses} branchName={branchName}/>}
                  {active === 'employees'     && <EmployeesSection employees={employees} onRefresh={fetchAll}/>}
                  {active === 'attendance'    && <AttendanceSection attendance={attendance} employees={employees}/>}
                  {active === 'leaves'        && <LeavesSection leaves={leaves} onRefresh={fetchAll}/>}
                  {active === 'payroll'       && <PayrollSection employees={employees}/>}
                  {active === 'expenses'      && <ExpensesSection expenses={expenses} onRefresh={fetchAll}/>}
                  {active === 'announcements' && <AnnouncementsSection branchName={branchName}/>}
                </motion.div>
              </AnimatePresence>
            )
          }
        </main>
      </div>
    </div>
  );
};

export default SubAdminDashboard;
