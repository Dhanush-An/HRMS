import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, Sparkles, Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave';
    checkIn?: string;
    checkOut?: string;
    workHours?: number;
}

const EmployeeAttendance = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDayStats, setSelectedDayStats] = useState<AttendanceRecord | null>(null);

    // Get number of days in month
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Get day of week for first day of month (0-6)
    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    useEffect(() => {
        fetchAttendance();
    }, [currentDate]);

    const fetchAttendance = async () => {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user) return; // Should handle redirect if no user

        try {
            const response = await fetch(`http://localhost:5000/api/attendance?employeeId=${user.id}`); // Assuming API supports filtering
            const data = await response.json();

            // Filter client-side if API doesn't support filtering
            const userAttendance = data.filter((r: any) => r.employeeId === user.id || r.employeeName === user.name);
            setAttendance(userAttendance);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDayStats(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDayStats(null);
    };

    const getDayStatus = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = attendance.find(r => r.date === dateStr);
        return record;
    };

    const handleDayClick = (record: AttendanceRecord | undefined) => {
        if (record) {
            setSelectedDayStats(record);
        } else {
            setSelectedDayStats(null);
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-28 bg-brand-bg/20 border border-brand-border/10 opacity-30"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const record = getDayStatus(day);
            const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

            let statusStyles = "";

            if (record) {
                if (record.status === 'Present') {
                    statusStyles = "bg-status-approved/10 border-status-approved/20 hover:bg-status-approved/20";
                } else if (record.status === 'Absent' || record.status === 'Leave') {
                    statusStyles = "bg-status-rejected/10 border-status-rejected/20 hover:bg-status-rejected/20";
                } else if (record.status === 'Half Day') {
                    statusStyles = "bg-status-pending/10 border-status-pending/20 hover:bg-status-pending/20";
                } else if (record.status === 'Late') {
                    statusStyles = "bg-brand-primary/10 border-brand-primary/20 hover:bg-brand-primary/20";
                }
            } else {
                statusStyles = "bg-brand-surface border-brand-border hover:bg-brand-bg";
            }

            const todayStyles = isToday ? "ring-2 ring-brand-primary z-10" : "";

            days.push(
                <div
                    key={day}
                    onClick={() => handleDayClick(record)}
                    className={cn(
                        "h-28 p-3 border rounded-xl transition-all cursor-pointer relative group",
                        statusStyles,
                        todayStyles
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "text-xs font-black p-1 rounded-lg flex items-center justify-center w-6 h-6",
                            isToday ? "bg-brand-primary text-white" : "text-brand-muted group-hover:text-brand-text"
                        )}>{day}</span>
                        {record && (
                            <div className="bg-brand-surface/50 p-1 rounded-lg">
                                {record.status === 'Present' && <CheckCircle className="w-3.5 h-3.5 text-status-approved" />}
                                {(record.status === 'Absent' || record.status === 'Leave') && <XCircle className="w-3.5 h-3.5 text-status-rejected" />}
                                {record.status === 'Late' && <Clock className="w-3.5 h-3.5 text-brand-primary" />}
                                {record.status === 'Half Day' && <Clock className="w-3.5 h-3.5 text-status-pending" />}
                            </div>
                        )}
                    </div>

                    {record && (
                        <div className="mt-auto absolute bottom-3 left-3 right-3 space-y-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-muted">
                                {record.checkIn || '--:--'}
                            </span>
                            <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full",
                                        record.status === 'Present' ? "bg-status-approved" :
                                            record.status === 'Late' ? "bg-brand-primary" : "bg-brand-muted"
                                    )}
                                    style={{ width: record.workHours ? `${(record.workHours / 9) * 100}%` : '0%' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Time Ledger</h1>
                    <p className="text-brand-muted font-medium italic">Tracking your professional commitment daily.</p>
                </div>

                <div className="flex items-center gap-4 p-1.5 bg-brand-surface rounded-xl border border-brand-border shadow-sm">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-brand-bg rounded-lg text-brand-muted hover:text-brand-primary transition-all active:scale-95">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center min-w-[140px]">
                        <span className="text-brand-text font-black text-xs uppercase tracking-widest">
                            {currentDate.toLocaleString('default', { month: 'long' })}
                        </span>
                        <span className="text-brand-muted text-[9px] font-bold">
                            {currentDate.getFullYear()}
                        </span>
                    </div>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-brand-bg rounded-lg text-brand-muted hover:text-brand-primary transition-all active:scale-95">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col justify-center items-center h-96 gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                    <p className="text-brand-muted text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Ledger...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Calendar Main View */}
                    <div className="lg:col-span-3">
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm overflow-hidden group">
                            <div className="grid grid-cols-7 mb-4 text-center">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-brand-muted text-[10px] font-black uppercase tracking-widest py-2">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {renderCalendar()}
                            </div>
                        </div>
                    </div>

                    {/* Stats & Insights Side Panel */}
                    <div className="space-y-6">
                        {/* Summary Insights */}
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="w-4 h-4 text-brand-primary" />
                                <h3 className="text-sm font-black text-brand-text tracking-widest uppercase">Monthly Vita</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-status-approved/5 rounded-xl border border-status-approved/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-status-approved/10 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-status-approved" />
                                        </div>
                                        <span className="text-xs font-bold text-brand-text">Present</span>
                                    </div>
                                    <span className="text-2xl font-black text-status-approved">
                                        {attendance.filter(r => r.status === 'Present').length}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-status-rejected/5 rounded-xl border border-status-rejected/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-status-rejected/10 rounded-lg">
                                            <XCircle className="w-4 h-4 text-status-rejected" />
                                        </div>
                                        <span className="text-xs font-bold text-brand-text">Leaves</span>
                                    </div>
                                    <span className="text-2xl font-black text-status-rejected">
                                        {attendance.filter(r => r.status === 'Absent' || r.status === 'Leave').length}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-status-pending/5 rounded-xl border border-status-pending/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-status-pending/10 rounded-lg">
                                            <Clock className="w-4 h-4 text-status-pending" />
                                        </div>
                                        <span className="text-xs font-bold text-brand-text">Late/Half</span>
                                    </div>
                                    <span className="text-2xl font-black text-status-pending">
                                        {attendance.filter(r => r.status === 'Late' || r.status === 'Half Day').length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Selected Day Expanded Details */}
                        {selectedDayStats ? (
                            <div className="bg-brand-surface border border-brand-primary/30 rounded-2xl p-6 shadow-md relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-12 w-12 rounded-xl bg-brand-bg border border-brand-border flex flex-col items-center justify-center">
                                        <span className="text-xs font-black text-brand-primary leading-none">{new Date(selectedDayStats.date).getDate()}</span>
                                        <span className="text-[8px] font-black uppercase text-brand-muted">{new Date(selectedDayStats.date).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-brand-text tracking-tight uppercase">Day Details</h3>
                                        <p className="text-brand-muted text-[10px] font-bold uppercase">{new Date(selectedDayStats.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-brand-bg p-3 rounded-xl border border-brand-border">
                                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Status</span>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            selectedDayStats.status === 'Present' ? "text-status-approved" :
                                                selectedDayStats.status === 'Absent' ? "text-status-rejected" :
                                                    "text-status-pending"
                                        )}>{selectedDayStats.status}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-brand-bg p-3 rounded-xl border border-brand-border text-center">
                                            <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest block mb-1">In</span>
                                            <span className="text-xs font-black text-brand-text block">{selectedDayStats.checkIn || '--:--'}</span>
                                        </div>
                                        <div className="bg-brand-bg p-3 rounded-xl border border-brand-border text-center">
                                            <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest block mb-1">Out</span>
                                            <span className="text-xs font-black text-brand-text block">{selectedDayStats.checkOut || '--:--'}</span>
                                        </div>
                                    </div>

                                    <div className="bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/10 flex flex-col items-center justify-center">
                                        <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-1">Work Hours</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-brand-primary tabular-nums">{selectedDayStats.workHours || '-'}</span>
                                            <span className="text-[10px] font-black text-brand-primary/60 uppercase">hrs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-brand-surface border border-brand-border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center h-64">
                                <Inbox className="w-8 h-8 text-brand-muted opacity-20 mb-3" />
                                <h4 className="text-brand-text font-black uppercase text-xs mb-1">No Selection</h4>
                                <p className="text-brand-muted text-[10px] font-medium leading-relaxed italic">Select a date to view detailed records.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendance;
