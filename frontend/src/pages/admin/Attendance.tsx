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
    MapPin,
    X,
    Maximize2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Employee {
    id: string;
    name: string;
    department: string;
    email?: string;
    username?: string;
}

interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    status: 'Present' | 'Absent' | 'Late' | 'Half Day';
    checkIn?: string; // HH:mm
    checkOut?: string; // HH:mm
    workHours?: number;
    latitude?: number;
    longitude?: number;
    location?: {
        lat: number;
        lng: number;
    };
    workMode?: string;
    workLocation?: string;
}

const formatTimeTo12Hour = (time?: string) => {
    if (!time || time === '--:--') return '--:--';
    try {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
        return time;
    }
};

const calculateWorkingHours = (checkIn?: string, checkOut?: string, dbWorkHours?: number) => {
    if (!checkIn || !checkOut || checkIn === '--:--' || checkOut === '--:--') {
        return dbWorkHours ? `${dbWorkHours.toFixed(1)} hrs` : '--:--';
    }
    try {
        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        
        let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
        if (diffMins < 0) diffMins += 24 * 60;
        
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        return `${hrs}h ${mins}m`;
    } catch {
        return dbWorkHours ? `${dbWorkHours.toFixed(1)} hrs` : '--:--';
    }
};

const Attendance = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    // Removed unused editingId
    // Removed unused setEditForm

    // Report State
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchQuery, setSearchQuery] = useState('');

    // Map Modal State
    const [mapModal, setMapModal] = useState<{ isOpen: boolean; empName: string; lat: number; lng: number }>({
        isOpen: false,
        empName: '',
        lat: 0,
        lng: 0
    });

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            const [empRes, attRes] = await Promise.all([
                api.get('/api/employees'),
                api.get(`/api/attendance?date=${selectedDate}`)
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
        const emp = employees.find(e => e.id === empId);
        const record = attendance.find(r =>
            ((r.employeeId === empId) ||
                (emp && r.employeeId === emp.email) ||
                (emp && r.employeeId === (emp as any).username)) &&
            r.date === selectedDate
        );
        if (!record) {
            const date = new Date(selectedDate);
            if (date.getDay() === 0) { // Sunday
                return {
                    id: `sunday-${empId}-${selectedDate}`,
                    employeeId: empId,
                    date: selectedDate,
                    status: 'Leave' as any,
                    isWeeklyOff: true
                } as any;
            }
        }
        return record;
    };



    // Removed unused handleSaveEdit

    const handleViewLocation = async (empId: string, empName: string, recordLocation?: { lat?: number; lng?: number }) => {
        // 1. Check if record has a specific Login Location
        if (recordLocation?.lat !== undefined && recordLocation.lng !== undefined) {
            setMapModal({
                isOpen: true,
                empName: `${empName} (Login Location)`,
                lat: Number(recordLocation.lat),
                lng: Number(recordLocation.lng)
            });
            return;
        }

        // 2. Fallback to Live Location
        try {
            const res = await api.get(`/api/employees/${empId}/location`);
            if (res.ok) {
                const data = await res.json();
                setMapModal({
                    isOpen: true,
                    empName: `${empName} (Live)`,
                    lat: Number(data.lat || 0),
                    lng: Number(data.lng || 0)
                });
            } else {
                alert("Location not found for this employee for this specific session.");
            }
        } catch (error) {
            console.error("Error fetching location:", error);
            alert("Failed to fetch location. Please try again later.");
        }
    };

    // Report Generation Logic
    const fetchMonthlyData = async () => {
        try {
            const response = await api.get('/api/attendance');
            const rawData = await response.json();
            const allData: AttendanceRecord[] = Array.isArray(rawData) ? rawData : [];
            return allData.filter(r => r && r.date && r.date.startsWith(reportMonth));
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
        present: Array.isArray(attendance) ? attendance.filter(r => ['Present', 'Late', 'Half Day'].includes(r.status)).length : 0,
        absent: Array.isArray(attendance) ? attendance.filter(r => r.status === 'Absent').length : 0,
        late: Array.isArray(attendance) ? attendance.filter(r => r.status === 'Late').length : 0,
        halfDay: Array.isArray(attendance) ? attendance.filter(r => r.status === 'Half Day').length : 0,
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight">Attendance Management</h1>
                    <p className="text-brand-muted font-medium text-sm md:text-base">Track and monitor employee presence in real-time.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-brand-surface p-2 rounded-2xl border border-brand-border shadow-sm backdrop-blur-md w-full lg:w-auto">
                    {/* Compact Date/Report Bar */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-brand-bg rounded-xl border border-brand-border group hover:border-brand-primary/30 transition-all cursor-pointer w-full sm:w-auto">
                        <Calendar className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-colors" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-brand-text focus:ring-0 text-sm font-black p-0 w-full sm:w-28 cursor-pointer"
                        />
                    </div>

                    <div className="hidden sm:block w-[1.5px] h-8 bg-brand-border" />

                    <div className="flex items-center gap-3 px-4 py-2 bg-brand-bg rounded-xl border border-brand-border group hover:border-brand-primary/30 transition-all cursor-pointer w-full sm:w-auto">
                        <span className="text-[10px] text-brand-muted font-black uppercase tracking-widest mr-1">Monthly</span>
                        <input
                            type="month"
                            value={reportMonth}
                            onChange={(e) => setReportMonth(e.target.value)}
                            className="bg-transparent border-none text-brand-text focus:ring-0 text-sm font-black p-0 w-full sm:w-28 cursor-pointer"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            <p className="text-brand-primary text-[10px] font-black uppercase tracking-widest mb-2">
                                {new Date(selectedDate).getDay() === 0 ? 'Status' : 'Half Day'}
                            </p>
                            <h3 className="text-3xl font-black text-brand-text leading-none">
                                {new Date(selectedDate).getDay() === 0 ? 'OFF' : stats.halfDay}
                            </h3>
                        </div>
                        <div className="p-3 bg-brand-primary/10 rounded-xl">
                            {new Date(selectedDate).getDay() === 0 ? <Calendar className="w-5 h-5 text-brand-primary" /> : <AlertCircle className="w-5 h-5 text-status-info" />}
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-brand-bg border border-brand-border rounded-xl py-2 pl-12 pr-4 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-xs font-medium w-full transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Attendance List - Desktop View */}
                <div className="hidden lg:block bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-table-header border-b border-brand-border">
                                <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Employee</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Check In</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Check Out</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest">Work Hours</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase text-brand-muted tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {employees.filter(emp =>
                                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                emp.department.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((emp) => {
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
                                                                    (record as any)?.isWeeklyOff ? "bg-brand-primary" :
                                                                        "bg-brand-muted/30"
                                                )} />
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    record?.status === 'Present' ? "text-status-approved" :
                                                        record?.status === 'Absent' ? "text-status-rejected" :
                                                            record?.status === 'Late' ? "text-status-pending" :
                                                                record?.status === 'Half Day' ? "text-status-info" :
                                                                    (record as any)?.isWeeklyOff ? "text-brand-primary" :
                                                                        "text-brand-muted"
                                                )}>
                                                    {(record as any)?.isWeeklyOff ? 'Weekly Off' : (record?.status || 'Not Marked')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-brand-text">
                                            <div className="flex flex-col gap-1">
                                                <span>{formatTimeTo12Hour(record?.checkIn)}</span>
                                                {record?.workMode && (
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border w-fit",
                                                        record.workMode === 'Work from Office'
                                                            ? "bg-brand-primary-light text-brand-primary border-brand-primary/20"
                                                            : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                                                    )}>
                                                        {record.workMode === 'Work from Office' ? 'Office' : 'Remote'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-brand-text">
                                            <div className="flex flex-col gap-1">
                                                <span>{formatTimeTo12Hour(record?.checkOut)}</span>
                                                {record?.workLocation && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-muted opacity-60">
                                                        {record.workLocation}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-brand-text">
                                            <span className="bg-brand-bg px-3 py-1 rounded-lg border border-brand-border">
                                                {calculateWorkingHours(record?.checkIn, record?.checkOut, record?.workHours)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-right">
                                            {record?.location ? (
                                                <button
                                                    onClick={() => handleViewLocation(emp.id, emp.name, record.location)}
                                                    className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-primary-light rounded-lg transition-all"
                                                    title="View Location"
                                                >
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

                {/* Attendance List - Card View (Mobile) */}
                <div className="lg:hidden p-4 space-y-4 bg-brand-bg/50">
                    {employees.filter(emp =>
                        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.department.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((emp) => {
                        const record = getAttendanceStatus(emp.id);
                        return (
                            <div key={emp.id} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-brand-primary-light flex items-center justify-center text-brand-primary font-black text-xs">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-brand-text">{emp.name}</div>
                                            <div className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{emp.department}</div>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                        record?.status === 'Present' ? "bg-status-approved/10 text-status-approved border-status-approved/20" :
                                            record?.status === 'Absent' ? "bg-status-rejected/10 text-status-rejected border-status-rejected/20" :
                                                record?.status === 'Late' ? "bg-status-pending/10 text-status-pending border-status-pending/20" :
                                                    record?.status === 'Half Day' ? "bg-status-info/10 text-status-info border-status-info/20" :
                                                        (record as any)?.isWeeklyOff ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" :
                                                            "bg-brand-muted/10 text-brand-muted border-brand-muted/20"
                                    )}>
                                        {(record as any)?.isWeeklyOff ? 'OFF' : (record?.status || 'N/A')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-brand-border border-dashed">
                                    <div>
                                        <span className="block text-[10px] text-brand-muted uppercase font-black tracking-widest mb-1">Check In</span>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-brand-text font-bold text-xs">{formatTimeTo12Hour(record?.checkIn)}</span>
                                            {record?.workMode && (
                                                <span className="text-[9px] font-black text-brand-primary uppercase">{record.workMode === 'Work from Office' ? 'Office' : 'Remote'}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] text-brand-muted uppercase font-black tracking-widest mb-1">Check Out</span>
                                        <div className="flex flex-col gap-1 items-end">
                                            <span className="text-brand-text font-bold text-xs">{formatTimeTo12Hour(record?.checkOut)}</span>
                                            {record?.workLocation && (
                                                <span className="text-[9px] font-black text-brand-muted opacity-60 uppercase tracking-tighter">{record.workLocation}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 p-3 bg-brand-bg rounded-xl border border-brand-border">
                                    <span className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Total Working Hours</span>
                                    <span className="text-sm font-black text-brand-primary">{calculateWorkingHours(record?.checkIn, record?.checkOut, record?.workHours)}</span>
                                </div>

                                {record?.location && (
                                    <button
                                        onClick={() => handleViewLocation(emp.id, emp.name, record.location)}
                                        className="w-full mt-4 bg-brand-bg border border-brand-border text-brand-text py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        <MapPin className="w-4 h-4 text-brand-primary" /> View Location
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Map Modal */}
            {mapModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMapModal(prev => ({ ...prev, isOpen: false }))}
                    />
                    <div className="relative bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-surface/80 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-brand-primary rounded-2xl shadow-lg shadow-brand-primary/20">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-1">Employee Location</h3>
                                    <p className="text-2xl font-black text-brand-text tracking-tighter">{mapModal.empName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMapModal(prev => ({ ...prev, isOpen: false }))}
                                className="p-3 hover:bg-brand-bg rounded-2xl transition-colors group"
                            >
                                <X className="w-6 h-6 text-brand-muted group-hover:text-brand-text" />
                            </button>
                        </div>

                        <div className="p-2 bg-brand-bg">
                            <div className="relative rounded-[1.5rem] overflow-hidden border border-brand-border shadow-inner bg-brand-surface aspect-video">
                                {mapModal.lat !== undefined && mapModal.lng !== undefined ? (
                                    <>
                                        <iframe
                                            title="Employee Location"
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            src={`https://maps.google.com/maps?q=${mapModal.lat},${mapModal.lng}&z=15&output=embed`}
                                            className="grayscale-[0.2] contrast-[1.1]"
                                        />
                                        <div className="absolute bottom-6 left-6 p-4 bg-brand-surface/90 backdrop-blur-md border border-brand-primary/20 rounded-2xl shadow-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-brand-primary rounded-full animate-pulse" />
                                                <p className="font-mono text-sm font-black text-brand-text">
                                                    {Number(mapModal.lat || 0).toFixed(6)}, {Number(mapModal.lng || 0).toFixed(6)}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <AlertCircle className="w-8 h-8 text-brand-muted opacity-20" />
                                        <p className="text-brand-muted text-[10px] font-black uppercase tracking-widest">Incomplete Coordinates</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-brand-surface border-t border-brand-border flex justify-between items-center">
                            <p className="text-sm font-medium text-brand-muted italic">
                                Real-time telemetry data synced successfully.
                            </p>
                            <button
                                onClick={() => window.open(`https://www.google.com/maps?q=${mapModal.lat},${mapModal.lng}`, '_blank')}
                                className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all"
                            >
                                <Maximize2 className="w-4 h-4" />
                                Open in Full Maps
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
