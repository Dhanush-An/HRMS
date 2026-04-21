import { useState, useEffect } from 'react';
import {
    Calculator,
    History,
    Download,
    BadgeDollarSign
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../api';

interface SalaryStructure {
    base: number;
    hra: number;
    transport: number;
    other: number;
}

interface Employee {
    id: string;
    name: string;
    department: string;
    role: string;
    salary?: SalaryStructure;
}

interface PayrollRecord {
    id: string;
    month: string;
    year: number;
    dateGenerated: string;
    records: {
        employeeId: string;
        name: string;
        base: number;
        bonus: number;
        tax: number;
        pf: number;
        netSalary: number;
    }[];
}

const Payroll = () => {
    const [activeTab, setActiveTab] = useState<'structure' | 'process' | 'history'>('structure');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [leavesData, setLeavesData] = useState<any[]>([]);

    // Process State
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: '2-digit' }));
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [processData, setProcessData] = useState<{ [key: string]: { bonus: number, tax?: number, pf?: number } }>({});

    const fetchData = async () => {
        try {
            const [historyRes, empRes, attRes, leavesRes] = await Promise.all([
                api.get('/api/payroll'),
                api.get('/api/employees'),
                api.get('/api/attendance'),
                api.get('/api/leaves')
            ]);
            const historyData = await historyRes.json();
            const employeesData = await empRes.json();
            const attData = await attRes.json();
            const leavesJson = await leavesRes.json();

            setPayrollHistory(historyData);
            setEmployees(employeesData);
            setAttendanceData(attData);
            setLeavesData(leavesJson);

            // Initialize process data
            const initialProcessData: any = {};
            employeesData.forEach((emp: Employee) => {
                initialProcessData[emp.id] = { bonus: 0 };
            });
            setProcessData(initialProcessData);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleSalaryUpdate = async (empId: string, field: keyof SalaryStructure, value: string) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;

        const currentSalary = emp.salary || { base: 0, hra: 0, transport: 0, other: 0 };
        const updatedSalary = { ...currentSalary, [field]: Number(value) };

        // Optimistic update
        const updatedEmployees = employees.map(e => e.id === empId ? { ...e, salary: updatedSalary } : e);
        setEmployees(updatedEmployees);

        try {
            await api.put(`/api/employees/${empId}/salary`, updatedSalary);
        } catch (error) {
            console.error("Error updating salary:", error);
            fetchData(); // Revert on error
        }
    };

    const calculateAttendanceStats = (empId: string) => {
        const monthNum = parseInt(selectedMonth);
        const prefix = `${selectedYear}-${selectedMonth}`;
        const records = attendanceData.filter(r => 
            (r.employeeId === empId || r.employeeName === empId) && 
            r.date.startsWith(prefix)
        );

        // Calculate Sundays in month
        let sundays = 0;
        const date = new Date(selectedYear, monthNum - 1, 1);
        while (date.getMonth() === monthNum - 1) {
            if (date.getDay() === 0) sundays++;
            date.setDate(date.getDate() + 1);
        }

        // Differentiate Present and Absent days
        const present = records.filter(r => r.status === 'Present').length;
        const halfDay = records.filter(r => r.status === 'Half Day').length;
        const absents = records.filter(r => r.status === 'Absent');
        
        // Check for penalties (unapproved leaves)
        let penalties = 0;
        absents.forEach(abs => {
            // Check if there is an approved leave for this date
            const hasApprovedLeave = leavesData.find(l => 
                l.employeeId === empId && 
                l.status === 'Approved' &&
                abs.date >= l.startDate && 
                abs.date <= l.endDate
            );

            if (!hasApprovedLeave) {
                penalties++; // Deduct one extra day for unapproved absence
            }
        });

        // Sundays are counted as Present (Paid Off)
        const totalPayableDays = Math.max(0, present + (halfDay * 0.5) + sundays - penalties);

        return { present, halfDay, sundays, penalties, totalPayableDays };
    };

    const calculateNetSalary = (emp: Employee) => {
        const salary = emp.salary || { base: 0, hra: 0, transport: 0, other: 0 };
        const { present, halfDay, sundays, penalties, totalPayableDays } = calculateAttendanceStats(emp.id);
        
        // Calculate Total Gross first
        const totalGross = salary.base + salary.hra + salary.transport + salary.other;
        
        // Pro-rate the Total Gross (assuming 30 days month)
        const dailyRate = totalGross / 30;
        const earnedSalary = dailyRate * totalPayableDays;
        
        const bonus = processData[emp.id]?.bonus || 0;
        
        const pf = (salary as any).pf ?? 0;
        const tax = (salary as any).tax ?? 0;

        return {
            totalEarnings: earnedSalary + bonus,
            actualBase: earnedSalary,
            totalPayableDays,
            presentData: { present, halfDay, sundays, penalties, totalPayableDays },
            tax,
            pf,
            netSalary: earnedSalary + bonus - tax - pf
        };
    };

    const handleProcessUpdate = async (empId: string, field: 'bonus' | 'tax' | 'pf', value: number) => {
        // Update local process state
        setProcessData(prev => ({
            ...prev,
            [empId]: { ...prev[empId], [field]: value }
        }));

        // If it's tax or pf, persist to employee salary config
        if (field === 'tax' || field === 'pf') {
            const emp = employees.find(e => e.id === empId);
            if (emp) {
                const currentSalary = emp.salary || { base: 0, hra: 0, transport: 0, other: 0 };
                const updatedSalary = { ...currentSalary, [field]: value };
                try {
                    await api.put(`/api/employees/${empId}/salary`, updatedSalary);
                } catch (error) {
                    console.error(`Error persisting ${field}:`, error);
                }
            }
        }
    };

    const handleGeneratePayroll = async () => {
        const records = employees.map(emp => {
            const { netSalary, tax, pf } = calculateNetSalary(emp);
            const salary = emp.salary || { base: 0, hra: 0, transport: 0, other: 0 };

            return {
                employeeId: emp.id,
                name: emp.name,
                base: salary.base,
                bonus: processData[emp.id]?.bonus || 0,
                tax,
                pf,
                netSalary: Number(netSalary.toFixed(2))
            };
        });

        try {
            const response = await api.post('/api/payroll/generate', {
                month: selectedMonth,
                year: selectedYear,
                records
            });

            if (response.ok) {
                // Removed localhost notification
                setActiveTab('history');
            } else {
                // Removed localhost notification
            }
        } catch (error) {
            console.error("Error generating payroll:", error);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Payroll Management</h1>
                    <p className="text-brand-muted font-medium">Automate and manage your workforce payouts securely.</p>
                </div>
                <div className="flex bg-brand-surface p-1 rounded-xl border border-brand-border shadow-sm">
                    {['structure', 'process', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95",
                                activeTab === tab
                                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                                    : "text-brand-muted hover:text-brand-text hover:bg-brand-bg"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Salary Structure Tab */}
            {activeTab === 'structure' && (
                <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-200">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-table-header border-b border-brand-border text-[11px] font-black uppercase text-brand-muted tracking-[0.2em]">
                                    <th className="px-2 py-4">Employee</th>
                                    <th className="px-2 py-4">Base</th>
                                    <th className="px-2 py-4">HRA</th>
                                    <th className="px-2 py-4">Transport</th>
                                    <th className="px-2 py-4">Other</th>
                                    <th className="px-2 py-4 text-right whitespace-nowrap">Total Gross</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {Array.isArray(employees) && employees.map((emp) => {
                                    const salary = emp.salary || { base: 0, hra: 0, transport: 0, other: 0 };
                                    const gross = salary.base + salary.hra + salary.transport + salary.other;
                                    return (
                                        <tr key={emp.id} className="hover:bg-brand-bg transition-colors group">
                                            <td className="px-2 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-brand-text truncate max-w-[120px]">{emp.name}</div>
                                                <div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider truncate max-w-[120px]">{emp.role}</div>
                                            </td>
                                            {['base', 'hra', 'transport', 'other'].map((field) => (
                                                <td key={field} className="px-2 py-4 whitespace-nowrap">
                                                    <div className="relative group/input">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within/input:text-brand-primary text-[10px] font-bold">₹</span>
                                                        <input
                                                            type="number"
                                                            value={salary[field as keyof SalaryStructure] || ''}
                                                            onChange={(e) => handleSalaryUpdate(emp.id, field as keyof SalaryStructure, e.target.value)}
                                                            className="w-24 bg-brand-bg border border-brand-border rounded-lg py-2 pl-5 pr-1 text-brand-text font-bold text-xs focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent transition-all outline-none"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="px-2 py-4 whitespace-nowrap text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-brand-text font-black text-base italic">₹{gross.toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-brand-muted uppercase">Gross</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Process Payroll Tab */}
            {activeTab === 'process' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
                        <div className="flex gap-2">
                            <div className="custom-select-container">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="bg-brand-bg border border-brand-border rounded-xl px-4 py-2 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all appearance-none pr-8"
                                >
                                    {[
                                        { v: '01', l: 'January' },
                                        { v: '02', l: 'February' },
                                        { v: '03', l: 'March' },
                                        { v: '04', l: 'April' },
                                        { v: '05', l: 'May' },
                                        { v: '06', l: 'June' },
                                        { v: '07', l: 'July' },
                                        { v: '08', l: 'August' },
                                        { v: '09', l: 'September' },
                                        { v: '10', l: 'October' },
                                        { v: '11', l: 'November' },
                                        { v: '12', l: 'December' }
                                    ].map(m => (
                                        <option key={m.v} value={m.v} className="bg-brand-surface text-brand-text">{m.l}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="custom-select-container">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-brand-bg border border-brand-border rounded-xl px-4 py-2 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all appearance-none pr-8"
                                >
                                    <option value={2026} className="bg-brand-surface text-brand-text">2026</option>
                                    <option value={2025} className="bg-brand-surface text-brand-text">2025</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex-1"></div>
                        <button
                            onClick={handleGeneratePayroll}
                            className="bg-status-approved hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-status-approved/20"
                        >
                            <Calculator className="w-4 h-4" />
                            Process Payroll
                        </button>
                    </div>

                    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-x-auto no-scrollbar shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-table-header border-b border-brand-border text-[11px] font-black uppercase text-brand-muted tracking-widest">
                                    <th className="px-2 py-4">Employee</th>
                                    <th className="px-2 py-4">Attendance</th>
                                    <th className="px-2 py-4">Base (Earned)</th>
                                    <th className="px-2 py-4">Bonus (+)</th>
                                    <th className="px-2 py-4">PF (-)</th>
                                    <th className="px-2 py-4">Tax (-)</th>
                                    <th className="px-2 py-4 text-right">Net Payable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {Array.isArray(employees) && employees.map((emp) => {
                                    const { netSalary, actualBase, presentData } = calculateNetSalary(emp);
                                    return (
                                        <tr key={emp.id} className="hover:bg-brand-bg transition-colors group">
                                            <td className="px-2 py-4 whitespace-nowrap text-brand-text font-bold truncate max-w-[120px]">{emp.name}</td>
                                            <td className="px-2 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-status-approved uppercase">P: {presentData.present}</span>
                                                    <span className="text-[10px] font-black text-status-pending uppercase">H: {presentData.halfDay}</span>
                                                    <span className="text-[10px] font-black text-brand-primary uppercase">Sun: {presentData.sundays}</span>
                                                    {presentData.penalties > 0 && (
                                                        <span className="text-[10px] font-black text-status-rejected uppercase">Penalty: -{presentData.penalties}d</span>
                                                    )}
                                                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-tighter border-t border-brand-border mt-1 pt-1">{presentData.totalPayableDays} Days</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-brand-muted font-medium text-sm">
                                                <div className="flex flex-col">
                                                    <span className="line-through opacity-40 text-[10px]">₹{(emp.salary?.base || 0).toLocaleString()}</span>
                                                    <span className="text-brand-text font-black">₹{Math.round(actualBase).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={processData[emp.id]?.bonus || ''}
                                                    onChange={(e) => handleProcessUpdate(emp.id, 'bonus', Number(e.target.value))}
                                                    className="w-24 bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-status-approved font-bold text-sm focus:ring-2 focus:ring-status-approved outline-none tracking-tight"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={processData[emp.id]?.pf !== undefined ? processData[emp.id]?.pf : (emp.salary as any)?.pf || ''}
                                                    onChange={(e) => handleProcessUpdate(emp.id, 'pf', Number(e.target.value))}
                                                    className="w-24 bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-status-rejected font-bold text-sm focus:ring-2 focus:ring-status-rejected outline-none tracking-tight"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={processData[emp.id]?.tax !== undefined ? processData[emp.id]?.tax : (emp.salary as any)?.tax || ''}
                                                    onChange={(e) => handleProcessUpdate(emp.id, 'tax', Number(e.target.value))}
                                                    className="w-24 bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-status-rejected font-bold text-sm focus:ring-2 focus:ring-status-rejected outline-none tracking-tight"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-status-approved font-black text-xl tracking-tight">₹{netSalary.toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-brand-muted uppercase">Net Pay</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="grid gap-6 animate-in slide-in-from-right-4 duration-300">
                    {payrollHistory.length === 0 ? (
                        <div className="text-center py-20 bg-brand-surface border border-brand-border rounded-2xl">
                            <History className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-20" />
                            <div className="text-brand-muted font-bold">No records found.</div>
                        </div>
                    ) : (
                        payrollHistory.map((payroll) => (
                            <div key={payroll.id} className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-brand-border">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand-primary-light rounded-xl flex items-center justify-center border border-brand-primary/20">
                                            <BadgeDollarSign className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-brand-text">{payroll.month} {payroll.year}</h3>
                                            <p className="text-brand-muted font-bold uppercase text-[10px] tracking-widest">Generated On {new Date(payroll.dateGenerated).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-brand-muted font-bold uppercase text-[10px] tracking-widest mb-1">Total Distribution</span>
                                        <div className="text-2xl font-black text-status-approved tracking-tight">
                                            ₹{payroll.records.reduce((sum, r) => sum + r.netSalary, 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-table-header border-b border-brand-border text-[10px] font-black uppercase text-brand-muted tracking-widest">
                                                <th className="px-2 py-3">Employee</th>
                                                <th className="px-2 py-3 text-right">Base</th>
                                                <th className="px-2 py-3 text-right">Bonus</th>
                                                <th className="px-2 py-3 text-right">PF</th>
                                                <th className="px-2 py-3 text-right">Tax</th>
                                                <th className="px-2 py-3 text-right">Net Pay</th>
                                                <th className="px-2 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-border">
                                            {Array.isArray(payroll.records) && payroll.records.map((record) => (
                                                <tr key={record.employeeId} className="hover:bg-brand-bg transition-colors">
                                                    <td className="px-2 py-4 text-sm font-bold text-brand-text truncate max-w-[120px] whitespace-nowrap">{record.name}</td>
                                                    <td className="px-2 py-4 text-sm text-right font-medium text-brand-muted whitespace-nowrap">₹{record.base.toLocaleString()}</td>
                                                    <td className="px-2 py-4 text-xs text-right font-bold text-status-approved whitespace-nowrap">+₹{record.bonus.toLocaleString()}</td>
                                                    <td className="px-2 py-4 text-xs text-right font-bold text-status-rejected whitespace-nowrap">-₹{(record.pf || 0).toLocaleString()}</td>
                                                    <td className="px-2 py-4 text-xs text-right font-bold text-status-rejected whitespace-nowrap">-₹{(record.tax || 0).toLocaleString()}</td>
                                                    <td className="px-2 py-4 text-sm text-right font-black text-status-approved whitespace-nowrap">₹{record.netSalary.toLocaleString()}</td>
                                                    <td className="px-2 py-4 text-right">
                                                        <button
                                                            className="text-brand-primary hover:opacity-80 p-2 hover:bg-brand-primary-light rounded-lg transition-all"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Payroll;
