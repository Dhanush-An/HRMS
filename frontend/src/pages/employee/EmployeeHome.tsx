import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    Briefcase,
    TrendingUp,
    Activity,
    ArrowUpRight,
    Zap,
    MessageSquare,
    Target,
    ShieldCheck
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { cn } from '../../utils/cn';
import AnnouncementPopup from '../../components/AnnouncementPopup';

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-brand-surface border border-brand-border p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] hover:shadow-2xl transition-all group relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-all duration-700"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-all duration-500 shadow-xl shadow-black/5 border border-white/10", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
            </div>
        </div>
        <div className="relative z-10">
            <h3 className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 group-hover:opacity-100 transition-opacity">{title}</h3>
            <p className="text-3xl font-black text-brand-text tracking-tighter group-hover:text-brand-primary transition-colors">{value}</p>
        </div>
    </motion.div>
);



const INSPIRATIONAL_QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue counts.", author: "Winston Churchill" },
    { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "Integrity is doing the right thing, even when no one is watching.", author: "C.S. Lewis" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" }
];

const EmployeeHome = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        leaveBalance: '0 Days',
        attendanceRate: '0%',
        pendingTasks: '0 Tasks'
    });
    const [pendingNotifications, setPendingNotifications] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const dailyQuote = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return INSPIRATIONAL_QUOTES[seed % INSPIRATIONAL_QUOTES.length];
    }, []);

    const fetchNotifications = async (userId: string) => {
        try {
            const [annRes, polRes] = await Promise.all([
                api.get('/api/announcements'),
                api.get('/api/policies')
            ]);

            if (annRes.ok && polRes.ok) {
                const announcements = await annRes.json();
                const policies = await polRes.json();

                const unseenAnnouncements = announcements.filter((a: any) => !a.seenBy?.includes(userId));
                const unseenPolicies = policies.filter((p: any) => !p.seenBy?.includes(userId));

                setPendingNotifications([...unseenAnnouncements, ...unseenPolicies]);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const fetchLatestUser = async (userId: string) => {
        try {
            const res = await api.get(`/api/employees/${encodeURIComponent(userId)}`);
            if (res.ok) {
                const updatedUser = await res.json();
                if (updatedUser) {
                    console.log("[EMPLOYEE HOME] Found live user data for stats calculation");
                    fetchStats(userId, updatedUser.leaveBalance);
                } else {
                    console.warn(`[EMPLOYEE HOME] User ${userId} not found or mismatch`);
                    fetchStats(userId, currentUser?.leaveBalance);
                }
            } else {
                console.warn("[EMPLOYEE HOME] Failed to fetch employee profile for live data sync");
                fetchStats(userId, currentUser?.leaveBalance);
            }
        } catch (error) {
            console.error("Error fetching live user data:", error);
            fetchStats(userId, currentUser?.leaveBalance);
        }
    };

    const fetchStats = async (employeeId: string, leaveBalance: any) => {
        try {
            const defaultBalance = { sick: 12, casual: 12, earned: 0, wfh: 10, paid: 15 };
            const balance = (leaveBalance && typeof leaveBalance === 'object') ? leaveBalance : defaultBalance;
            const totalLeaves = 
                (Number(balance.sick) || 0) + 
                (Number(balance.casual) || 0) + 
                (Number(balance.earned) || 0) + 
                (Number(balance.wfh) || 0) + 
                (Number(balance.paid) || 0);

            const taskRes = await api.get(`/api/tasks?employeeId=${employeeId}`);
            const tasks = await taskRes.json();
            const pending = Array.isArray(tasks) ? tasks.filter((t: any) => t.status === 'Pending').length : 0;

            const attRes = await api.get(`/api/attendance?employeeId=${employeeId}`);
            const attendance = await attRes.json();
            const presentDays = Array.isArray(attendance) ? attendance.filter((r: any) => r.status === 'Present' || r.status === 'Late').length : 0;

            setStats({
                leaveBalance: `${totalLeaves} Days`,
                attendanceRate: presentDays > 0 ? `${Math.min(100, Math.round((presentDays / 22) * 100))}%` : '0%',
                pendingTasks: `${pending} Tasks`
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const handleDismissNotification = async (id: string, type: 'announcement' | 'policy') => {
        if (!currentUser) return;

        try {
            const endpoint = type === 'announcement' ? `/api/announcements/${id}/seen` : `/api/policies/${id}/seen`;
            const res = await api.put(endpoint, { employeeId: currentUser.id });

            if (res.ok) {
                setPendingNotifications(prev => prev.filter(item => (item.id || item._id) !== id));
            }
        } catch (error) {
            console.error(`Error marking ${type} as seen:`, error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log("[EMPLOYEE HOME] Dashboard initialized for:", parsedUser.name);
                setCurrentUser(parsedUser);
                // Fetch latest user data to get live balances
                fetchLatestUser(parsedUser.id);
                // Fetch announcements and policies
                fetchNotifications(parsedUser.id);
            } catch (err) {
                console.error("[EMPLOYEE HOME] Error parsing user data from localStorage", err);
            }
        } else {
            console.warn("[EMPLOYEE HOME] No user data in localStorage on mount");
        }
    }, []);

    return (
        <div className="space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AnnouncementPopup 
                items={pendingNotifications} 
                onDismiss={handleDismissNotification} 
            />
            {/* Premium Hero Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-blue-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative space-y-5">
                    <div className="flex flex-col">
                        <span className="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 animate-in fade-in slide-in-from-left-4 duration-700 block">Forge India Connect • Human Resources</span>
                        <h1 className="text-4xl md:text-6xl font-black text-brand-text tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            Welcome Back, <br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-400">
                                {currentUser?.name?.split(' ')[0] || 'Member'}
                            </span>
                        </h1>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                        <div className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border rounded-2xl shadow-sm">
                            <Briefcase className="w-4 h-4 text-brand-primary/60" />
                            <span className="text-[10px] font-black text-brand-text uppercase tracking-widest leading-none">
                                {currentUser?.role || 'Team Member'}
                            </span>
                        </div>
                        
                        <div className="h-6 w-px bg-brand-border hidden md:block" />
                        
                        <div className="max-w-xl">
                            <p className="text-brand-muted font-medium italic text-base md:text-lg leading-relaxed flex items-start gap-3">
                                <span className="text-3xl text-brand-primary/20 -mt-2">"</span>
                                <span>{dailyQuote.text}</span>
                                <span className="text-3xl text-brand-primary/20 self-end -mb-4">"</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <StatCard title="Entitled Leave" value={stats.leaveBalance} icon={Calendar} color="bg-brand-primary" delay={0.1} />
                <StatCard title="Compliance Rate" value={stats.attendanceRate} icon={ShieldCheck} color="bg-emerald-500" delay={0.2} />
                <StatCard title="Current Status" value="Online" icon={Activity} color="bg-indigo-500" delay={0.3} />
                <StatCard title="Pending Output" value={stats.pendingTasks} icon={Target} color="bg-rose-500" delay={0.4} />
            </div>

            {/* Shift Protocols (New) */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <Clock className="w-48 h-48" />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6 text-brand-primary" />
                            <h2 className="text-xl font-black text-brand-text uppercase tracking-widest">Office Shift Protocols</h2>
                        </div>
                        <p className="text-brand-muted font-medium italic">Adhere to the institutional timeline to ensure operational excellence.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                        <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border text-center group hover:border-brand-primary transition-all">
                            <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Office Hours</span>
                            <span className="text-lg font-black text-brand-text block tracking-tight">09:30 AM - 06:30 PM</span>
                            <span className="text-[8px] font-bold text-emerald-500 uppercase mt-2 block tracking-widest">Threshold: 9:45 AM</span>
                        </div>
                        <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border text-center group hover:border-brand-primary transition-all">
                            <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Lunch Interval</span>
                            <span className="text-lg font-black text-brand-text block tracking-tight">01:00 PM - 02:00 PM</span>
                            <span className="text-[8px] font-bold text-brand-primary uppercase mt-2 block tracking-widest">Standard Break</span>
                        </div>
                        <div className="bg-brand-primary/10 p-6 rounded-2xl border border-brand-primary/20 text-center group hover:bg-brand-primary/20 transition-all">
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block mb-1 font-bold">Attendance Rule</span>
                            <span className="text-sm font-black text-brand-text block leading-tight mt-1">Login after 9:45 AM</span>
                            <span className="text-[10px] font-black text-rose-500 uppercase mt-2 block tracking-widest">Marks Half Day</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl md:rounded-[3rem] p-5 md:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <Activity className="w-48 h-48" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                        <h2 className="text-lg md:text-xl font-black text-brand-text uppercase tracking-widest flex items-center gap-4">
                            Recent Events
                            <div className="hidden sm:block h-px w-20 bg-brand-primary opacity-20"></div>
                        </h2>
                        <button className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all flex items-center gap-2">
                            Access Full Logs <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="space-y-8">
                        {[
                            { type: 'Attendance', status: 'Clock In', info: 'Main Office Node', date: '5 hours ago', icon: Zap },
                            { type: 'Payroll', status: 'Processed', info: 'Financial Statement', date: 'Yesterday', icon: Briefcase },
                        ].map((activity, i) => (
                            <div key={i} className="flex gap-6 items-start group">
                                <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center flex-shrink-0 border border-brand-border shadow-inner group-hover:border-brand-primary transition-all duration-500">
                                    <activity.icon className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-brand-text uppercase tracking-tight text-lg">{activity.info}</h4>
                                        <span className="text-[9px] text-brand-muted uppercase font-black tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">{activity.date}</span>
                                    </div>
                                    <p className="text-sm font-medium text-brand-muted leading-relaxed">
                                        Procedural {activity.type.toLowerCase()} record has been <span className="text-brand-primary font-black uppercase tracking-widest mx-1">{activity.status.toLowerCase()}</span> successfully.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Summary */}
                <div className="space-y-6 md:space-y-10">
                    <div className="bg-brand-surface border border-brand-border rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-xl relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 p-8 opacity-[0.05] group-hover:scale-125 group-hover:rotate-45 transition-all duration-700">
                            <Clock className="w-48 h-48" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter uppercase mb-2 text-brand-text">Request Leave</h3>
                                <p className="text-brand-muted text-sm font-medium leading-relaxed italic">Initiate professional break protocols across internal modules.</p>
                            </div>
                            <button
                                onClick={() => navigate('/employee-dashboard/leaves')}
                                className="w-full bg-brand-primary text-white hover:bg-white hover:text-brand-primary px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all border-b-4 border-brand-primary/20 hover:border-brand-bg"
                            >
                                Apply Now
                            </button>
                        </div>
                    </div>

                    <div className="bg-brand-surface border border-brand-border rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-xl group relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 p-6 opacity-5">
                            <MessageSquare className="w-20 h-20" />
                        </div>
                        <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest mb-6 opacity-60">System Inspiration</h3>
                        <p className="italic text-brand-muted font-medium leading-relaxed text-lg">
                            "Forge India Connect keeps our dreams soaring and operations connected."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeHome;
