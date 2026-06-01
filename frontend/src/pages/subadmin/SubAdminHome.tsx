import { useState, useEffect } from 'react';
import { Users, DollarSign, Briefcase, FileText, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import api from '../../api';

const StatCard = ({ title, value, icon: Icon, color, delay, onClick }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        onClick={onClick}
        className={cn(
            "bg-brand-surface border border-brand-border p-4 md:p-6 rounded-2xl md:rounded-3xl hover:shadow-lg transition-all group",
            onClick && "cursor-pointer hover:border-brand-primary/50"
        )}
    >
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-sm", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            {onClick && <ExternalLink className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-colors" />}
        </div>
        <h3 className="text-brand-muted text-sm font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-black text-brand-text mt-1">{value}</p>
    </motion.div>
);

const SubAdminHome = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalPayroll: 0,
        activeProjects: 0,
        pendingRequests: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/subadmin/stats');
                const data = await res.json();
                
                if (data) {
                    setStats({
                        totalEmployees: data.totalEmployees || 0,
                        totalPayroll: data.totalPayroll || 0,
                        activeProjects: data.activeProjects || 0,
                        pendingRequests: data.pendingRequests || 0
                    });
                }
            } catch (error) {
                console.error("Error fetching subadmin stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-1 px-2 md:px-0">
                <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight">Dashboard Overview</h1>
                <p className="text-brand-muted font-medium text-sm md:text-base">Welcome back! Here's what's happening in your branch.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees.toString()}
                    icon={Users}
                    color="bg-blue-600"
                    delay={0.1}
                />
                <StatCard
                    title="Total Payroll"
                    value={formatCurrency(stats.totalPayroll)}
                    icon={DollarSign}
                    color="bg-emerald-600"
                    delay={0.2}
                />
                <StatCard
                    title="Active Projects"
                    value={stats.activeProjects.toString()}
                    icon={Briefcase}
                    color="bg-purple-600"
                    delay={0.3}
                />
                <StatCard
                    title="Pending Requests"
                    value={stats.pendingRequests.toString()}
                    icon={FileText}
                    color="bg-amber-600"
                    delay={0.4}
                />
                <StatCard
                    title="Employee Details"
                    value="Shared Drive"
                    icon={FileText}
                    color="bg-indigo-600"
                    delay={0.5}
                    onClick={() => window.open('https://drive.google.com/drive/folders/1tazZKUNBb-cO-YXP9vIVkAUs0GlAGu7L?usp=sharing', '_blank')}
                />
            </div>
        </div>
    );
};

export default SubAdminHome;
