import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    XCircle,
    UserCheck,
    Search,
    Download,
    Save,
    AlertCircle,
    MapPin
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { API_URL } from '../../config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Employee {
    id: string;
    name: string;
    department: string;
}

interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    status: 'Present' | 'Absent' | 'Late' | 'Half Day';
    checkIn?: string; // HH:mm
    checkOut?: string; // HH:mm
    workHours?: number;
}

const Attendance = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    // Removed unused editingId
    // Removed unused setEditForm

    // Report State
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            const [empRes, attRes] = await Promise.all([
                fetch(`${API_URL}/api/employees`),
                fetch(`${API_URL}/api/attendance?date=${selectedDate}`)
            ]);

            const empData = await empRes.json();
            const attData = await attRes.json();

            setEmployees(empData);
            setAttendance(attData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const getAttendanceStatus = (empId: string) => {
        return attendance.find(r => r.employeeId === empId && r.date === selectedDate);
    };



    // Removed unused handleSaveEdit

    // Report Generation Logic
    const fetchMonthlyData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/attendance`);
            const allData: AttendanceRecord[] = await response.json();
            return allData.filter(r => r.date.startsWith(reportMonth));
        } catch (error) {
            console.error("Error fetching report data:", error);
            return [];
        }
    };

    const handleExportPDF = async () => {
        const data = await fetchMonthlyData();
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Attendance Report - ${reportMonth}`, 14, 22);

        const tableData = data.map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            return [
                emp?.name || 'Unknown',
                r.date,
                r.status,
                r.checkIn || '-',
                r.checkOut || '-',
                r.workHours ? `${r.workHours} hrs` : '-'
            ];
        });

        autoTable(doc, {
            head: [['Employee', 'Date', 'Status', 'Check In', 'Check Out', 'Work Hours']],
            body: tableData,
            startY: 30,
        });

        doc.save(`attendance_report_${reportMonth}.pdf`);
    };

    const handleExportExcel = async () => {
        const data = await fetchMonthlyData();
        const excelData = data.map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            return {
                Employee: emp?.name || 'Unknown',
                Date: r.date,
                Status: r.status,
                'Check In': r.checkIn || '-',
                'Check Out': r.checkOut || '-',
                'Work Hours': r.workHours || 0
            };
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `attendance_report_${reportMonth}.xlsx`);
    };

    // Stats Calculation
    const stats = {
        present: attendance.filter(r => r.status === 'Present').length,
        absent: attendance.filter(r => r.status === 'Absent').length,
        late: attendance.filter(r => r.status === 'Late').length,
        halfDay: attendance.filter(r => r.status === 'Half Day').length,
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Attendance Management</h1>
                    <p className="text-brand-muted font-medium">Track and monitor employee presence in real-time.</p>
                </div>

                <div className="flex items-center gap-4 bg-brand-surface p-2 rounded-2xl border border-brand-border shadow-sm backdrop-blur-md">
                    {/* Compact Date/Report Bar */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-brand-bg rounded-xl border border-brand-border group hover:border-brand-primary/30 transition-all cursor-pointer">
                        <Calendar className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-colors" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-brand-text focus:ring-0 text-sm font-black p-0 w-28 cursor-pointer"
                        />
                    </div>

                    <div className="w-[1.5px] h-8 bg-brand-border" />

                    <div className="flex items-center gap-3 px-4 py-2 bg-brand-bg rounded-xl border border-brand-border group hover:border-brand-primary/30 transition-all cursor-pointer">
                        <span className="text-[10px] text-brand-muted font-black uppercase tracking-widest mr-1">Monthly</span>
                        <input
                            type="month"
                            value={reportMonth}
                            onChange={(e) => setReportMonth(e.target.value)}
                            className="bg-transparent border-none text-brand-text focus:ring-0 text-sm font-black p-0 w-28 cursor-pointer"
                        />
                        <div className="flex items-center gap-2 ml-2 border-l border-brand-border pl-3">
                            <button
                                onClick={handleExportPDF}
                                className="p-2 hover:bg-brand-primary/10 rounded-xl text-brand-muted hover:text-brand-primary transition-all active:scale-90"
                                title="Download PDF"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="p-2 hover:bg-emerald-500/10 rounded-xl text-brand-muted hover:text-emerald-500 transition-all active:scale-90"
                                title="Download Excel"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-status-approved text-[10px] font-black uppercase tracking-widest mb-2">Present</p>
                            <h3 className="text-3xl font-black text-brand-text leading-none">{stats.present}</h3>
                        </div>
                        <div className="p-3 bg-status-approved/10 rounded-xl">
                            <UserCheck className="w-5 h-5 text-status-approved" />
                        </div>
                    </div>
                </div>
                <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-status-rejected text-[10px] font-black uppercase tracking-widest mb-2">Absent</p>
                            <h3 className="text-3xl font-black text-brand-text leading-none">{stats.absent}</h3>
                        </div>
                        <div className="p-3 bg-status-rejected/10 rounded-xl">
                            <XCircle className="w-5 h-5 text-status-rejected" />
                        </div>
                    </div>
                </div>
                <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-status-pending text-[10px] font-black uppercase tracking-widest mb-2">Late</p>
                            <h3 className="text-3xl font-black text-brand-text leading-none">{stats.late}</h3>
                        </div>
                        <div className="p-3 bg-status-pending/10 rounded-xl">
                            <Clock className="w-5 h-5 text-status-pending" />
                        </div>
                    </div>
                </div>
                <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-status-info text-[10px] font-black uppercase tracking-widest mb-2">Half Day</p>
                            <h3 className="text-3xl font-black text-brand-text leading-none">{stats.halfDay}</h3>
                        </div>
                        <div className="p-3 bg-status-info/10 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-status-info" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-brand-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <h2 className="text-lg font-black text-brand-text">Daily Attendance List</h2>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                className="bg-brand-bg border border-brand-border rounded-xl py-2 pl-12 pr-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-xs font-medium w-full transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-table-header border-b border-brand-border text-[11px] font-black uppercase text-brand-muted tracking-[0.2em]">
                                <th className="px-8 py-4">Employee</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Check In</th>
                                <th className="px-8 py-4">Check Out</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {employees.map((emp) => {
                                const record = getAttendanceStatus(emp.id);
                                return (
                                    <tr key={emp.id} className="hover:bg-brand-bg transition-colors group">
                                        <td className="px-8 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-brand-primary-light flex items-center justify-center text-brand-primary font-black text-xs shadow-sm group-hover:scale-110 transition-transform">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-brand-text">{emp.name}</div>
                                                    <div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{emp.department}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    record?.status === 'Present' ? "bg-status-approved" :
                                                        record?.status === 'Absent' ? "bg-status-rejected" :
                                                            record?.status === 'Late' ? "bg-status-pending" :
                                                                record?.status === 'Half Day' ? "bg-status-info" :
                                                                    "bg-brand-muted/30"
                                                )} />
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    record?.status === 'Present' ? "text-status-approved" :
                                                        record?.status === 'Absent' ? "text-status-rejected" :
                                                            record?.status === 'Late' ? "text-status-pending" :
                                                                record?.status === 'Half Day' ? "text-status-info" :
                                                                    "text-brand-muted"
                                                )}>
                                                    {record?.status || 'Not Marked'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-brand-text">
                                            {record?.checkIn || '--:--'}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-brand-text">
                                            {record?.checkOut || '--:--'}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-right">
                                            {record ? (
                                                <button className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-primary-light rounded-lg transition-all" title="View Location">
                                                    <MapPin className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-brand-muted text-[10px] font-black uppercase tracking-widest opacity-40">Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
