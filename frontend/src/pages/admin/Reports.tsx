import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    Calendar,
    Plus,
    Download,
    Search
} from 'lucide-react';

interface Task {
    id: string;
    employeeId: string;
    description: string;
    date: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
}

interface Employee {
    id: string;
    name: string;
    department: string;
}

const Reports = () => { // Renamed conceptually to Daily Tasks
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filters
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    // Form
    const [formData, setFormData] = useState({
        employeeId: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        priority: 'Medium',
        status: 'Pending'
    });

    useEffect(() => {
        fetchData();
    }, [selectedDate, selectedEmployee]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [taskRes, empRes] = await Promise.all([
                api.get(`/api/tasks?date=${selectedDate}${selectedEmployee ? `&employeeId=${selectedEmployee}` : ''}`),
                api.get('/api/employees')
            ]);

            setTasks(await taskRes.json());
            setEmployees(await empRes.json());
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/tasks', formData);

            if (response.ok) {
                setShowModal(false);
                fetchData();
                setFormData({
                    employeeId: '',
                    description: '',
                    date: selectedDate,
                    priority: 'Medium',
                    status: 'Pending'
                });
                // Removed localhost notification
            }
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };



    const handleExport = () => {
        const rows = [
            ['Employee', 'Task Description', 'Date', 'Priority', 'Status'],
            ...tasks.map(t => [
                employees.find(e => e.id === t.employeeId)?.name || 'Unknown',
                t.description,
                t.date,
                t.priority,
                t.status
            ])
        ];

        let csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `daily_tasks_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Daily Task Reports</h1>
                    <p className="text-brand-muted font-medium">Track and manage employee daily activities</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleExport}
                        className="bg-brand-bg text-brand-muted px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all hover:bg-brand-surface hover:text-brand-text border border-brand-border shadow-sm text-xs uppercase tracking-widest active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-brand-primary/20 text-xs uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" />
                        Assign Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-wrap gap-6 items-center shadow-sm">
                <div className="flex items-center gap-3 bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
                    <Calendar className="w-4 h-4 text-brand-muted" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-brand-text text-sm font-bold focus:outline-none cursor-pointer"
                    />
                </div>

                <div className="flex items-center gap-3 bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 flex-1 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
                    <Search className="w-4 h-4 text-brand-muted" />
                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="bg-transparent text-brand-text text-sm font-bold focus:outline-none w-full cursor-pointer appearance-none uppercase tracking-widest text-[10px]"
                    >
                        <option value="">All Employees</option>
                        {Array.isArray(employees) && employees.map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-brand-bg/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Employee</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Work Report / Task</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Priority</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {loading ? (
                                <tr><td colSpan={4} className="px-8 py-10 text-center text-brand-muted font-medium italic">Loading tasks...</td></tr>
                            ) : tasks.length === 0 ? (
                                <tr><td colSpan={4} className="px-8 py-10 text-center text-brand-muted font-medium italic">No tasks found for this date.</td></tr>
                            ) : (
                                Array.isArray(tasks) && tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-brand-bg/30 transition-colors group">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="text-brand-text font-black text-sm">{getEmployeeName(task.employeeId)}</div>
                                            <div className="text-[9px] text-brand-muted font-bold uppercase tracking-widest mt-0.5">Assigned: {task.date}</div>
                                        </td>
                                        <td className="px-8 py-6 text-brand-text font-medium text-sm max-w-md italic">
                                            "{task.description}"
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                                task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                    'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-2xl border ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                task.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                                                    'bg-brand-muted/10 text-brand-muted border-brand-border'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                    task.status === 'In Progress' ? 'bg-indigo-500 animate-pulse' :
                                                        'bg-brand-muted'
                                                    }`}></span>
                                                {task.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-xl font-black text-brand-text uppercase tracking-tight">Assign Task</h2>
                                <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mt-1">Direct employee activity</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-colors group">
                                <Plus className="w-6 h-6 rotate-45 text-brand-muted group-hover:text-brand-text transition-colors" />
                            </button>
                        </div>

                        <form onSubmit={handleAddTask} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Target Employee</label>
                                <select
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-black text-xs h-[52px] appearance-none cursor-pointer focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner uppercase tracking-wider"
                                    value={formData.employeeId}
                                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Task / Goal Description</label>
                                <textarea
                                    className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-medium text-sm placeholder-brand-muted focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner italic min-h-[100px] resize-none"
                                    placeholder="Describe the objective or requirements..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Assign Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-black text-xs h-[52px] focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner uppercase tracking-wider cursor-pointer"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 pl-1">Priority</label>
                                    <select
                                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-black text-xs h-[52px] appearance-none cursor-pointer focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-inner uppercase tracking-wider"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-brand-bg text-brand-muted p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-brand-border hover:bg-brand-surface hover:text-brand-text transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-brand-primary text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/30 border-t border-white/20 uppercase tracking-[0.2em] text-[10px]"
                                >
                                    Assign Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
