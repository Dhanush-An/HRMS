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
    ShieldCheck,
    MapPin,
    Navigation,
    Globe
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import api from '../../api';
import { cn } from '../../utils/cn';

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

const LiveLocationCard = () => {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCurrentLocation = () => {
            if (!navigator.geolocation) {
                setError("Geolocation is not supported");
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => setError(err.message)
            );
        };
        fetchCurrentLocation();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-surface border border-brand-border rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                <Globe className="w-40 h-40" />
            </div>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-brand-primary rounded-2xl shadow-lg shadow-brand-primary/20">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest opacity-60">Live Presence</h3>
                        <p className="text-xl font-black text-brand-text tracking-tighter">Current Location</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-primary/20 animate-pulse">
                    <Activity className="w-3 h-3" />
                    <span>Live</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="p-6 bg-brand-bg rounded-2xl border border-brand-border shadow-inner">
                    <p className="text-sm font-medium text-brand-muted mb-1 uppercase tracking-tighter opacity-60">Geospatial Coordinates</p>
                    <p className="text-2xl font-black text-brand-primary tracking-tighter font-mono">
                        {error ? <span className="text-rose-500 text-sm italic">{error}</span> :
                            location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Locating..."}
                    </p>
                </div>

                <button
                    onClick={() => location && window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank')}
                    disabled={!location}
                    className="w-full h-14 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    <Navigation className="w-4 h-4" />
                    Transcend to Map
                </button>
            </div>
        </motion.div>
    );
};

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
    const [stats, setStats] = useState({
        leaveBalance: '0 Days',
        attendanceRate: '0%',
        pendingTasks: '0 Tasks'
    });
    const [user, setUser] = useState<any>(null);

    const dailyQuote = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return INSPIRATIONAL_QUOTES[seed % INSPIRATIONAL_QUOTES.length];
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Fetch latest user data to get live balances
            fetchLatestUser(parsedUser.id);
        }
    }, []);

    const fetchLatestUser = async (userId: string) => {
        try {
            const res = await api.get(`/api/employees`);
            if (res.ok) {
                const employees = await res.json();
                const updatedUser = employees.find((e: any) => e.id === userId || e.employeeId === userId);
                if (updatedUser) {
                    setUser(updatedUser);
                    fetchStats(userId, updatedUser.leaveBalance);
                }
            }
        } catch (error) {
            console.error("Error fetching live user data:", error);
        }
    };

    const fetchStats = async (employeeId: string, leaveBalance: any) => {
        try {
            const totalLeaves = leaveBalance ?
                (leaveBalance.sick || 0) + (leaveBalance.casual || 0) + (leaveBalance.earned || 0) + (leaveBalance.wfh || 0) + (leaveBalance.paid || 0) : 0;

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

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <p className="text-brand-muted font-medium italic text-base md:text-lg leading-relaxed max-w-2xl">"{dailyQuote.text}"</p>
                    <p className="text-brand-primary font-black uppercase tracking-widest text-[10px] mt-2">— {dailyQuote.author}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <StatCard title="Entitled Leave" value={stats.leaveBalance} icon={Calendar} color="bg-brand-primary" delay={0.1} />
                <StatCard title="Compliance Rate" value={stats.attendanceRate} icon={ShieldCheck} color="bg-emerald-500" delay={0.2} />
                <StatCard title="Current Status" value="Online" icon={Activity} color="bg-indigo-500" delay={0.3} />
                <StatCard title="Pending Output" value={stats.pendingTasks} icon={Target} color="bg-rose-500" delay={0.4} />
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
                            { type: 'Leave', status: 'Approved', info: 'Annual Leave Request', date: '2 hours ago', icon: Calendar },
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
                    {user && <LiveLocationCard />}
                    <div className="bg-brand-primary rounded-2xl md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(99,102,241,0.5)] border border-brand-primary/20">
                        <div className="absolute -top-12 -right-12 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-45 transition-all duration-700">
                            <Clock className="w-48 h-48" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">Request Leave</h3>
                                <p className="text-white/70 text-sm font-medium leading-relaxed italic">Initiate professional break protocols across internal modules.</p>
                            </div>
                            <button className="w-full bg-white text-brand-primary px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all border-b-4 border-brand-bg">
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
                            "Gravity may keep us on the ground, but Antigraviity keeps our dreams soaring."
                        </p>
                        <div className="flex items-center gap-4 mt-8">
                            <div className="h-1 w-12 bg-brand-primary rounded-full group-hover:w-16 transition-all duration-500" />
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Collective Spirits</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeHome;
