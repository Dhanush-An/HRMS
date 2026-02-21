import { useState, useEffect } from 'react';
import { Users, DollarSign, Briefcase, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-brand-surface border border-brand-border p-6 rounded-3xl hover:shadow-lg transition-all group"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-sm", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
        <h3 className="text-brand-muted text-sm font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-black text-brand-text mt-1">{value}</p>
    </motion.div>
);

const AdminHome = () => {
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
                const [empRes, payRes, leaveRes, taskRes] = await Promise.all([
                    fetch('http://localhost:5000/api/employees'),
                    fetch('http://localhost:5000/api/payroll'),
                    fetch('http://localhost:5000/api/leaves'),
                    fetch('http://localhost:5000/api/tasks')
                ]);

                const [employees, payroll, leaves, tasks] = await Promise.all([
                    empRes.json(),
                    payRes.json(),
                    leaveRes.json(),
                    taskRes.json()
                ]);

                // Calculate Total Payroll
                const totalPayroll = payroll.reduce((total: number, p: any) => {
                    return total + (p.records?.reduce((s: number, r: any) => s + (r.netSalary || 0), 0) || 0);
                }, 0);

                // Calculate Pending Requests
                const pendingRequests = leaves.filter((l: any) => l.status === 'Pending').length;

                // Calculate Active Projects
                const activeProjects = new Set(
                    tasks
                        .map((t: any) => t.projectName)
                        .filter((name: string) => name && name.trim() !== '')
                ).size;

                setStats({
                    totalEmployees: employees.length,
                    totalPayroll,
                    activeProjects,
                    pendingRequests
                });
            } catch (error) {
                console.error("Error fetching admin stats:", error);
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
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-brand-text tracking-tight">Dashboard Overview</h1>
                <p className="text-brand-muted font-medium">Welcome back! Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            </div>
        </div>
    );
};

export default AdminHome;
