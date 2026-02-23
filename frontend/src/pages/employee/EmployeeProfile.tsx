import { useState, useEffect } from 'react';
import {
    User, Briefcase,
    Shield, Sun, Moon,
    Camera, Edit2, Globe,
    Activity, ShieldCheck, MapPin
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const EmployeeProfile = () => {
    const [user, setUser] = useState<any>(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (!user) return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary shadow-lg"></div>
            <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Synchronizing Identity...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase flex items-center gap-4">
                        Personnel Profile
                        <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
                            <span className="text-[10px] text-brand-primary tracking-widest font-black uppercase">Verified</span>
                        </div>
                    </h1>
                    <p className="text-brand-muted font-medium italic">Secure access to individual records and system preferences.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="group flex items-center gap-3 px-6 py-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text font-black text-xs uppercase tracking-widest hover:bg-brand-bg transition-all active:scale-95 shadow-sm"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-4 h-4 text-amber-500" />
                                <span>Light</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4 text-brand-primary" />
                                <span>Dark</span>
                            </>
                        )}
                    </button>

                    <button className="p-2.5 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-primary transition-all">
                        <Edit2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Identity Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full bg-brand-primary/10 p-1 group-hover:bg-brand-primary/20 transition-all duration-500">
                                <div className="w-full h-full rounded-full bg-brand-bg flex items-center justify-center overflow-hidden border-2 border-brand-border">
                                    <span className="text-4xl font-black text-brand-muted/30 uppercase">{user.name?.charAt(0)}</span>
                                </div>
                            </div>
                            <button className="absolute bottom-0 right-0 p-2.5 bg-brand-primary text-white rounded-lg shadow-lg hover:scale-110 active:scale-90 transition-all border-2 border-brand-surface">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-brand-text tracking-tight uppercase">{user.name}</h2>
                            <div className="flex flex-col items-center gap-1">
                                <span className="px-3 py-0.5 bg-brand-primary/10 text-brand-primary rounded text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                                <span className="text-brand-muted text-[10px] font-black uppercase tracking-widest opacity-60">{user.department} Unit</span>
                            </div>
                        </div>

                        <div className="w-full h-px bg-brand-border my-6"></div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                            <div className="p-4 bg-brand-bg rounded-xl border border-brand-border">
                                <Activity className="w-4 h-4 text-brand-primary mx-auto mb-2 opacity-30" />
                                <span className="block text-xs font-black text-brand-text">98%</span>
                                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-tighter">Engagement</span>
                            </div>
                            <div className="p-4 bg-brand-bg rounded-xl border border-brand-border">
                                <ShieldCheck className="w-4 h-4 text-brand-primary mx-auto mb-2 opacity-30" />
                                <span className="block text-xs font-black text-brand-text">Active</span>
                                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-tighter">Status</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-brand-primary" />
                            <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest">Connect</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-bg transition-colors">
                                <MapPin className="w-4 h-4 text-brand-muted" />
                                <span className="text-[11px] font-medium text-brand-muted">Main Headquarters</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-bg transition-colors">
                                <Briefcase className="w-4 h-4 text-brand-muted" />
                                <span className="text-[11px] font-medium text-brand-muted">Full-time Onsite</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Information Hub */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Bio/Summary */}
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-sm">
                        <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest mb-6 flex items-center gap-3">
                            <User className="w-4 h-4 text-brand-primary" />
                            Personal Attributes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-brand-muted text-[10px] font-black uppercase tracking-widest pl-1">Name</label>
                                <p className="text-brand-text font-black text-sm bg-brand-bg p-4 rounded-xl border border-brand-border">{user.name}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-brand-muted text-[10px] font-black uppercase tracking-widest pl-1">Email</label>
                                <p className="text-brand-text font-black text-sm bg-brand-bg p-4 rounded-xl border border-brand-border lowercase">{user.email}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-brand-muted text-[10px] font-black uppercase tracking-widest pl-1">Contact</label>
                                <p className="text-brand-text font-black text-sm bg-brand-bg p-4 rounded-xl border border-brand-border">{user.phone || 'Not Shared'}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-brand-muted text-[10px] font-black uppercase tracking-widest pl-1">Entry Date</label>
                                <p className="text-brand-text font-black text-sm bg-brand-bg p-4 rounded-xl border border-brand-border">{user.joiningDate || 'Internal'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Operational Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-sm">
                            <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest mb-6 flex items-center gap-3">
                                <Briefcase className="w-4 h-4 text-brand-primary" />
                                Active Role
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-brand-bg rounded-xl border border-brand-border">
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Node ID</span>
                                    <span className="text-brand-primary font-black uppercase text-xs">{user.id}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-brand-bg rounded-xl border border-brand-border">
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Title</span>
                                    <span className="text-brand-text font-black uppercase text-xs">{user.role}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-brand-bg rounded-xl border border-brand-border">
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Unit</span>
                                    <span className="text-brand-text font-black uppercase text-xs">{user.department}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-sm">
                            <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest mb-6 flex items-center gap-3">
                                <Shield className="w-4 h-4 text-brand-primary" />
                                Operational Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-brand-bg rounded-xl border border-brand-border">
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Account</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-status-approved"></div>
                                        <span className="text-status-approved font-black uppercase text-[9px]">Verified</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-brand-bg rounded-xl border border-brand-border">
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Last Auth</span>
                                    <span className="text-brand-text font-black uppercase text-xs opacity-60">Today, 09:21 AM</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-brand-bg rounded-xl border border-brand-border">
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Access</span>
                                    <span className="text-brand-text font-black uppercase text-xs opacity-60">Full Suite</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-brand-bg border border-brand-border border-dashed rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-brand-muted italic uppercase tracking-widest">Contact Administration for credential modifications.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
