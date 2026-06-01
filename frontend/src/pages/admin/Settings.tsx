import { useState, useEffect } from 'react';
import api from '../../api';
import { Save, User, Lock, Search, Shield, Eye, EyeOff } from 'lucide-react';

interface Employee {
    id: string;
    name: string;
    email: string;
    username?: string;
    role: string;
    department?: string;
}

const Settings = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    
    // Employee Section State
    const [empSelectedId, setEmpSelectedId] = useState<string>('');
    const [empFormData, setEmpFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [empLoading, setEmpLoading] = useState(false);
    const [empMessage, setEmpMessage] = useState('');
    const [empSearchQuery, setEmpSearchQuery] = useState('');
    const [empShowResults, setEmpShowResults] = useState(false);
    const [empShowPassword, setEmpShowPassword] = useState(false);

    // HR Section State (NEW)
    const [hrSelectedId, setHrSelectedId] = useState<string>('');
    const [hrFormData, setHrFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [hrLoading, setHrLoading] = useState(false);
    const [hrMessage, setHrMessage] = useState('');
    const [hrSearchQuery, setHrSearchQuery] = useState('');
    const [hrShowResults, setHrShowResults] = useState(false);
    const [hrShowPassword, setHrShowPassword] = useState(false);

    // Admin Section State
    const [adminFormData, setAdminFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminMessage, setAdminMessage] = useState('');
    const [showAdminPassword, setShowAdminPassword] = useState(false);

    useEffect(() => {
        api.get('/api/employees')
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error(err));
    }, []);

    const handleSelectEmployee = (id: string) => {
        setEmpSelectedId(id);
        const emp = employees.find(e => e.id === id);
        if (emp) {
            setEmpFormData({
                username: emp.username || '',
                email: emp.email || '',
                password: ''
            });
        }
    };

    const handleSelectHR = (id: string) => {
        setHrSelectedId(id);
        const hr = employees.find(e => e.id === id);
        if (hr) {
            setHrFormData({
                username: hr.username || '',
                email: hr.email || '',
                password: ''
            });
        }
    };

    const handleEmployeeUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmpLoading(true);
        setEmpMessage('');

        try {
            const { password, ...rest } = empFormData;
            const payload = password ? { ...rest, password } : rest;

            const response = await api.put(`/api/employees/${empSelectedId}`, payload);
            if (response.ok) {
                setEmpMessage('Employee credentials updated successfully!');
                const updatedEmps = Array.isArray(employees) ? employees.map(e =>
                    e.id === empSelectedId ? { ...e, username: empFormData.username, email: empFormData.email } : e
                ) : [];
                setEmployees(updatedEmps);
                setEmpFormData(prev => ({ ...prev, password: '' }));
            } else {
                setEmpMessage('Failed to update employee credentials.');
            }
        } catch (error) {
            console.error(error);
            setEmpMessage('Error updating employee credentials.');
        } finally {
            setEmpLoading(false);
        }
    };

    const handleHRUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setHrLoading(true);
        setHrMessage('');

        try {
            const { password, ...rest } = hrFormData;
            const payload = password ? { ...rest, password } : rest;

            const response = await api.put(`/api/employees/${hrSelectedId}`, payload);
            if (response.ok) {
                setHrMessage('HR credentials updated successfully!');
                const updatedEmps = Array.isArray(employees) ? employees.map(e =>
                    e.id === hrSelectedId ? { ...e, username: hrFormData.username, email: hrFormData.email } : e
                ) : [];
                setEmployees(updatedEmps);
                setHrFormData(prev => ({ ...prev, password: '' }));
            } else {
                setHrMessage('Failed to update HR credentials.');
            }
        } catch (error) {
            console.error(error);
            setHrMessage('Error updating HR credentials.');
        } finally {
            setHrLoading(false);
        }
    };

    const handleAdminUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminLoading(true);
        setAdminMessage('');

        try {
            const response = await api.put('/api/admin/credentials', adminFormData);

            if (response.ok) {
                setAdminMessage('Admin credentials updated successfully!');
                setAdminFormData(prev => ({ ...prev, password: '' }));
            } else {
                const data = await response.json();
                setAdminMessage(data.message || 'Failed to update admin credentials.');
            }
        } catch (error) {
            console.error(error);
            setAdminMessage('Error updating admin credentials.');
        } finally {
            setAdminLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            {/* Employee Credential Management */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-visible shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="p-8 border-b border-brand-border bg-table-header rounded-t-3xl flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-brand-text uppercase tracking-tight flex items-center gap-3">
                            <Shield className="w-6 h-6 text-brand-primary" />
                            Employee Credentials
                        </h2>
                        <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1">General Staff Access Control</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border shadow-inner relative">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-3 pl-1">Find Employee to Manage</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                className="w-full bg-brand-surface border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-black text-xs focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-sm uppercase tracking-wider placeholder:text-brand-muted/50"
                                placeholder="TYPE NAME OR EMPLOYEE ID..."
                                value={empSearchQuery}
                                onChange={(e) => {
                                    setEmpSearchQuery(e.target.value);
                                    setEmpShowResults(true);
                                }}
                                onFocus={() => setEmpShowResults(true)}
                            />

                            {empShowResults && (empSearchQuery || employees.length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 no-scrollbar">
                                    {Array.isArray(employees) && employees
                                        .filter(e => e.role !== 'hr' && e.department !== 'Human Resources')
                                        .filter(e => {
                                            const nameStr = e.name || '';
                                            const idStr = e.id || '';
                                            return nameStr.toLowerCase().includes(empSearchQuery.toLowerCase()) ||
                                                idStr.toLowerCase().includes(empSearchQuery.toLowerCase());
                                        })
                                        .map((emp) => (
                                            <button
                                                key={emp.id}
                                                onClick={() => {
                                                    handleSelectEmployee(emp.id);
                                                    setEmpSearchQuery(`${emp.name} (${emp.id})`);
                                                    setEmpShowResults(false);
                                                }}
                                                className="w-full text-left px-6 py-4 hover:bg-brand-primary hover:text-white transition-all border-b border-brand-border last:border-0 flex justify-between items-center group/item"
                                            >
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-wider">{emp.name}</p>
                                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">{emp.role}</p>
                                                </div>
                                                <div className="text-[9px] font-mono bg-brand-bg group-hover/item:bg-white/20 px-2 py-1 rounded-lg">
                                                    {emp.id}
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                        {empShowResults && <div className="fixed inset-0 z-40" onClick={() => setEmpShowResults(false)} />}
                    </div>

                    {empSelectedId && (
                        <form onSubmit={handleEmployeeUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">New Username</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={empFormData.username}
                                        onChange={(e) => setEmpFormData({ ...empFormData, username: e.target.value })}
                                        placeholder="Enter unique username"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="email"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={empFormData.email}
                                        onChange={(e) => setEmpFormData({ ...empFormData, email: e.target.value })}
                                        placeholder="employee@hrms.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">New Password (Optional)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type={empShowPassword ? "text" : "password"}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-12 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={empFormData.password}
                                        onChange={(e) => setEmpFormData({ ...empFormData, password: e.target.value })}
                                        placeholder="Leave blank to keep current"
                                    />
                                    <button type="button" onClick={() => setEmpShowPassword(!empShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2">
                                        {empShowPassword ? <EyeOff className="w-5 h-5 text-brand-muted" /> : <Eye className="w-5 h-5 text-brand-muted" />}
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-brand-border">
                                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{empMessage}</span>
                                <button type="submit" disabled={empLoading} className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50">
                                    {empLoading ? 'Updating...' : 'Sync Employee Credentials'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* HR Credential Management (NEW SECTION) */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-visible shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-300">
                <div className="p-8 border-b border-brand-border bg-table-header rounded-t-3xl flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-brand-text uppercase tracking-tight flex items-center gap-3">
                            <User className="w-6 h-6 text-brand-primary" />
                            HR Credentials
                        </h2>
                        <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1">Human Resources Access Control</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border shadow-inner relative">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-3 pl-1">Find HR Member to Manage</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                className="w-full bg-brand-surface border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-black text-xs focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-sm uppercase tracking-wider placeholder:text-brand-muted/50"
                                placeholder="TYPE NAME OR HR ID..."
                                value={hrSearchQuery}
                                onChange={(e) => {
                                    setHrSearchQuery(e.target.value);
                                    setHrShowResults(true);
                                }}
                                onFocus={() => setHrShowResults(true)}
                            />

                            {hrShowResults && (hrSearchQuery || employees.length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 no-scrollbar">
                                    {Array.isArray(employees) && employees
                                        .filter(e => e.role === 'hr' || e.department === 'Human Resources')
                                        .filter(e => {
                                            const nameStr = e.name || '';
                                            const idStr = e.id || '';
                                            return nameStr.toLowerCase().includes(hrSearchQuery.toLowerCase()) ||
                                                idStr.toLowerCase().includes(hrSearchQuery.toLowerCase());
                                        })
                                        .map((hr) => (
                                            <button
                                                key={hr.id}
                                                onClick={() => {
                                                    handleSelectHR(hr.id);
                                                    setHrSearchQuery(`${hr.name} (${hr.id})`);
                                                    setHrShowResults(false);
                                                }}
                                                className="w-full text-left px-6 py-4 hover:bg-brand-primary hover:text-white transition-all border-b border-brand-border last:border-0 flex justify-between items-center group/item"
                                            >
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-wider">{hr.name}</p>
                                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">{hr.role}</p>
                                                </div>
                                                <div className="text-[9px] font-mono bg-brand-bg group-hover/item:bg-white/20 px-2 py-1 rounded-lg">
                                                    {hr.id}
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                        {hrShowResults && <div className="fixed inset-0 z-40" onClick={() => setHrShowResults(false)} />}
                    </div>

                    {hrSelectedId && (
                        <form onSubmit={handleHRUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">New HR Username</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={hrFormData.username}
                                        onChange={(e) => setHrFormData({ ...hrFormData, username: e.target.value })}
                                        placeholder="Enter unique HR username"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="email"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={hrFormData.email}
                                        onChange={(e) => setHrFormData({ ...hrFormData, email: e.target.value })}
                                        placeholder="hr@hrms.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">New HR Password (Optional)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type={hrShowPassword ? "text" : "password"}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-12 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={hrFormData.password}
                                        onChange={(e) => setHrFormData({ ...hrFormData, password: e.target.value })}
                                        placeholder="Leave blank to keep current"
                                    />
                                    <button type="button" onClick={() => setHrShowPassword(!hrShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2">
                                        {hrShowPassword ? <EyeOff className="w-5 h-5 text-brand-muted" /> : <Eye className="w-5 h-5 text-brand-muted" />}
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-brand-border">
                                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{hrMessage}</span>
                                <button type="submit" disabled={hrLoading} className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50">
                                    {hrLoading ? 'Updating...' : 'Sync HR Credentials'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Admin Security Section */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-visible shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="p-8 border-b border-brand-border bg-table-header rounded-t-3xl flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-brand-text uppercase tracking-tight flex items-center gap-3">
                            <Lock className="w-6 h-6 text-brand-primary" />
                            Admin Account Security
                        </h2>
                        <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1">Master Dashboard Access Control</p>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleAdminUpdate} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">Admin Display Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={adminFormData.name}
                                        onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                                        placeholder="Admin Display Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">Admin Email Address</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="email"
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={adminFormData.email}
                                        onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                                        placeholder="admin@hrms.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">Master Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type={showAdminPassword ? "text" : "password"}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-12 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                        value={adminFormData.password}
                                        onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                                        placeholder="Update Master Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-primary/60 hover:text-brand-primary transition-all z-10 flex items-center justify-center rounded-lg hover:bg-brand-primary/5"
                                    >
                                        {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest pl-1 mt-2 flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    Changing these credentials will affect all future admin logins immediately.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-brand-border">
                            <div className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                {adminMessage && (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        {adminMessage}
                                    </>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={adminLoading}
                                className="w-full md:w-auto bg-brand-primary text-white px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-brand-primary/30 disabled:opacity-50 text-[10px] uppercase tracking-[0.2em] border-t border-white/20"
                            >
                                <Save className="w-4 h-4" />
                                {adminLoading ? 'Processing...' : 'Apply Admin Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
