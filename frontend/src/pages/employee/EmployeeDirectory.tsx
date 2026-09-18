import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, MapPin, Users } from 'lucide-react';
import api from '../../api';

interface TeamMember {
    id: string;
    employeeId?: string;
    name: string;
    email: string;
    role: string;
    department: string;
    branchName?: string;
    phone?: string;
    avatar?: string;
    status: string;
}

const EmployeeDirectory: React.FC = () => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'employees' | 'hr'>('all');

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/employees');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMembers(data);
                }
            }
        } catch (error) {
            console.error('Error fetching directory:', error);
        } finally {
            setLoading(false);
        }
    };

    const isHR = (m: TeamMember) => {
        const dept = (m.department || '').toLowerCase();
        const role = (m.role || '').toLowerCase();
        const id = (m.employeeId || m.id || '').toUpperCase();
        return dept.includes('human resource') || dept.includes('hr') || role.includes('hr') || id.startsWith('HR');
    };

    const filteredMembers = members.filter((m) => {
        // Filter by tab
        if (activeFilter === 'employees' && isHR(m)) return false;
        if (activeFilter === 'hr' && !isHR(m)) return false;

        // Filter by search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const name = (m.name || '').toLowerCase();
        const role = (m.role || '').toLowerCase();
        const dept = (m.department || '').toLowerCase();
        const branch = (m.branchName || '').toLowerCase();
        const id = (m.employeeId || m.id || '').toLowerCase();

        return name.includes(q) || role.includes(q) || dept.includes(q) || branch.includes(q) || id.includes(q);
    });

    const getAvatarUrl = (avatar?: string) => {
        if (!avatar) return null;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return avatar.startsWith('http') ? avatar : `${baseUrl}${avatar}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Company Directory</h1>
                    <p className="text-brand-muted font-medium italic mt-1">Connect and collaborate with all employees and HR team members.</p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 p-1.5 bg-brand-surface border border-brand-border rounded-2xl shadow-sm">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            activeFilter === 'all'
                                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                                : 'text-brand-muted hover:text-brand-text'
                        }`}
                    >
                        All Members ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('employees')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            activeFilter === 'employees'
                                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                                : 'text-brand-muted hover:text-brand-text'
                        }`}
                    >
                        Employees ({members.filter(m => !isHR(m)).length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('hr')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            activeFilter === 'hr'
                                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                                : 'text-brand-muted hover:text-brand-text'
                        }`}
                    >
                        HR & People ({members.filter(isHR).length})
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md shadow-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brand-muted" />
                <input
                    type="text"
                    placeholder="Search by name, role, department, branch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-2xl py-3.5 pl-12 pr-4 text-brand-text placeholder-brand-muted text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                />
            </div>

            {/* Member Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="bg-brand-surface border border-brand-border rounded-3xl p-16 text-center shadow-sm">
                    <Users className="w-12 h-12 text-brand-muted/40 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-brand-text uppercase tracking-tight">No Members Found</h3>
                    <p className="text-brand-muted text-xs font-medium mt-1">Try refining your search keyword or active tab filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMembers.map((member) => {
                        const avatarUrl = getAvatarUrl(member.avatar);
                        const isMemberHR = isHR(member);
                        const memberId = member.employeeId || member.id;

                        return (
                            <div
                                key={member.id || member.employeeId}
                                className="bg-brand-surface border border-brand-border rounded-3xl p-6 hover:shadow-xl hover:border-brand-primary/30 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-brand-primary/10 transition-all pointer-events-none"></div>

                                <div>
                                    {/* Top badge */}
                                    <div className="flex justify-between items-center mb-5">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                                            isMemberHR
                                                ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                                : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                                        }`}>
                                            {isMemberHR ? 'HR Team' : (member.department || 'Employee')}
                                        </span>
                                        <span className="text-[10px] font-mono text-brand-muted tracking-tighter opacity-70">
                                            {memberId}
                                        </span>
                                    </div>

                                    {/* Avatar & Info */}
                                    <div className="flex flex-col items-center text-center mb-6">
                                        <div className="w-20 h-20 rounded-2xl p-[2px] bg-gradient-to-tr from-brand-primary to-blue-500 mb-4 shadow-lg shadow-brand-primary/15 group-hover:scale-105 transition-transform duration-300">
                                            <div className="w-full h-full rounded-[14px] bg-brand-surface overflow-hidden flex items-center justify-center">
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-black text-brand-primary uppercase">
                                                        {member.name ? member.name.charAt(0) : 'U'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-base font-black text-brand-text tracking-tight group-hover:text-brand-primary transition-colors">
                                            {member.name}
                                        </h3>
                                        <p className="text-xs font-bold text-brand-muted mt-0.5 line-clamp-1">
                                            {member.role}
                                        </p>

                                        {member.branchName && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-muted mt-2 opacity-80">
                                                <MapPin className="w-3.5 h-3.5 text-brand-primary/70 shrink-0" />
                                                <span>{member.branchName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Actions */}
                                <div className="pt-4 border-t border-brand-border/60 flex items-center justify-center gap-3">
                                    {member.email && (
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="flex-1 py-2 px-3 bg-brand-bg hover:bg-brand-primary hover:text-white text-brand-text rounded-xl border border-brand-border text-center text-xs font-bold transition-all flex items-center justify-center gap-2"
                                            title={member.email}
                                        >
                                            <Mail className="w-3.5 h-3.5" />
                                            <span>Email</span>
                                        </a>
                                    )}
                                    {member.phone && member.phone !== 'N/A' && (
                                        <a
                                            href={`tel:${member.phone}`}
                                            className="flex-1 py-2 px-3 bg-brand-bg hover:bg-emerald-500 hover:text-white text-brand-text rounded-xl border border-brand-border text-center text-xs font-bold transition-all flex items-center justify-center gap-2"
                                            title={member.phone}
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            <span>Call</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EmployeeDirectory;
