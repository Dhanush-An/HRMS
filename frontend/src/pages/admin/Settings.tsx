import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { Save, User, Lock, Search, Shield } from 'lucide-react';

interface Employee {
    id: string;
    name: string;
    email: string;
    username?: string;
    role: string;
}

const Settings = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmp, setSelectedEmp] = useState<string>('');
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/employees`)
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error(err));
    }, []);

    const handleSelectEmployee = (id: string) => {
        setSelectedEmp(id);
        const emp = employees.find(e => e.id === id);
        if (emp) {
            setFormData({
                username: emp.username || '',
                password: '' // Don't show existing password for security
            });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(`${API_URL}/api/employees/${selectedEmp}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setMessage('Credentials updated successfully!');
                // Update local state
                const updatedEmps = employees.map(e =>
                    e.id === selectedEmp ? { ...e, username: formData.username } : e
                );
                setEmployees(updatedEmps);
                setFormData(prev => ({ ...prev, password: '' })); // Clear password field
            } else {
                setMessage('Failed to update credentials.');
            }
        } catch (error) {
            console.error(error);
            setMessage('Error updating credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="p-8 border-b border-brand-border bg-table-header flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-brand-text uppercase tracking-tight flex items-center gap-3">
                            <Shield className="w-6 h-6 text-brand-primary" />
                            Credential Management
                        </h2>
                        <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1">Administrator Control Panel</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Search & Selection */}
                    <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border shadow-inner relative">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-3 pl-1">Find Employee to Manage</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                className="w-full bg-brand-surface border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-black text-xs focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-sm uppercase tracking-wider placeholder:text-brand-muted/50"
                                placeholder="TYPE NAME OR EMPLOYEE ID..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                            />

                            {/* Dropdown Results */}
                            {showResults && (searchQuery || employees.length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 no-scrollbar">
                                    {employees
                                        .filter(e =>
                                            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            e.role.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .map((emp) => (
                                            <button
                                                key={emp.id}
                                                onClick={() => {
                                                    handleSelectEmployee(emp.id);
                                                    setSearchQuery(`${emp.name} (${emp.id})`);
                                                    setShowResults(false);
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
                                    {employees.filter(e =>
                                        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        e.id.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).length === 0 && (
                                            <div className="p-8 text-center text-brand-muted text-[10px] font-black uppercase tracking-widest italic">
                                                No results found.
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                        {/* Overlay to close results when clicking outside */}
                        {showResults && <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />}
                    </div>

                    {selectedEmp && (
                        <form onSubmit={handleUpdate} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">New Username</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="text"
                                            className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="Enter unique username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest pl-1">New Security Token / Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="password"
                                            className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 pl-12 pr-4 text-brand-text font-medium text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-brand-border">
                                <div className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    {message && (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            {message}
                                        </>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full md:w-auto bg-brand-primary text-white px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-brand-primary/30 disabled:opacity-50 text-[10px] uppercase tracking-[0.2em] border-t border-white/20"
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Processing...' : 'Sync Credentials'}
                                </button>
                            </div>
                        </form>
                    )}

                    {!selectedEmp && (
                        <div className="text-center py-20 px-6 bg-brand-bg rounded-2xl border border-dashed border-brand-border group">
                            <Shield className="w-12 h-12 text-brand-muted/20 mx-auto mb-4 group-hover:text-brand-primary/20 transition-colors duration-500" />
                            <p className="text-brand-muted text-xs font-black uppercase tracking-widest italic">Protected Zone: Select an employee to begin synchronization</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
