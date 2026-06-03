import { useState, useEffect } from 'react';
import api from '../../api';
import { User, Lock, Search, Shield, Eye, EyeOff } from 'lucide-react';

interface Employee {
    id: string;
    name: string;
    email: string;
    username?: string;
    role: string;
    department?: string;
}

const SubAdminSettings = () => {
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
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
        </div>
    );
};

export default SubAdminSettings;
