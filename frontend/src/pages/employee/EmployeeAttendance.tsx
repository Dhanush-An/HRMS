import { useState, useEffect } from 'react';
import api from '../../api';
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
    workMode?: string;
    workLocation?: string;
    shiftType?: string;
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
            const response = await api.get(`/api/attendance?employeeId=${user.id}`);
            const data = await response.json();

            // Filter client-side if API doesn't support filtering
            const userAttendance = Array.isArray(data) ? data.filter((r: any) => (r.employeeId === user.id || r.employeeName === user.name)) : [];
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

        if (!record) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isWeeklyOff = date.getDay() === 0;

            if (isWeeklyOff) {
                return {
                    id: `sunday-${dateStr}`,
                    employeeId: '',
                    date: dateStr,
                    status: 'Leave' as const,
                    isWeeklyOff: true
                } as any;
            }

            // If the date is in the past and no record exists, mark as Absent
            if (date < today) {
                return {
                    id: `absent-${dateStr}`,
                    employeeId: '',
                    date: dateStr,
                    status: 'Absent' as const,
                    isSynthetic: true
                } as any;
            }
        }
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
            days.push(<div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 bg-brand-bg/20 border border-brand-border/10 opacity-30"></div>);
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
                    const isSunday = (record as any).isWeeklyOff;
                    const isSyntheticAbsent = (record as any).isSynthetic;
                    statusStyles = (isSunday)
                        ? "bg-brand-primary/5 border-brand-primary/10 hover:bg-brand-primary/10"
                        : (isSyntheticAbsent)
                            ? "bg-status-rejected/5 border-status-rejected/10 hover:bg-status-rejected/20"
                            : "bg-status-rejected/10 border-status-rejected/20 hover:bg-status-rejected/20";
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
                        "h-16 md:h-24 lg:h-28 p-1 md:p-3 border rounded-xl transition-all cursor-pointer relative group",
                        statusStyles,
                        todayStyles
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "text-[10px] md:text-xs font-black p-0.5 md:p-1 rounded-lg flex items-center justify-center w-5 h-5 md:w-6 md:h-6",
                            isToday ? "bg-brand-primary text-white" : "text-brand-muted group-hover:text-brand-text"
                        )}>{day}</span>
                        {record && (
                            <div className="bg-brand-surface/50 p-0.5 md:p-1 rounded-lg">
                                {record.status === 'Present' && <CheckCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-status-approved" />}
                                {record.status === 'Leave' && (
                                    (record as any).isWeeklyOff
                                        ? <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-brand-primary opacity-60" />
                                        : <XCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-status-status-rejected" />
                                )}
                                {record.status === 'Absent' && <XCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-status-rejected" />}
                                {record.status === 'Late' && <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-brand-primary" />}
                                {record.status === 'Half Day' && <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-status-pending" />}
                            </div>
                        )}
                    </div>

                    {record && (record as any).isWeeklyOff && (
                        <div className="mt-1 md:mt-2 text-center">
                            <span className="text-[7px] md:text-[10px] font-black uppercase tracking-tighter text-brand-primary opacity-60">Off</span>
                        </div>
                    )}

                    {record && !record.isWeeklyOff && !record.isSynthetic && (
                        <div className="mt-auto absolute bottom-1 md:bottom-2 left-1 md:left-2 right-1 md:right-2 space-y-0 md:space-y-1">
                            {record.shiftType && (
                                <span className={cn(
                                    "block text-[6px] md:text-[8px] font-black uppercase truncate",
                                    record.shiftType === 'Night Shift' ? "text-brand-primary" : "text-amber-500"
                                )}>
                                    {record.shiftType === 'Night Shift' ? 'Night' : 'Day'}
                                </span>
                            )}
                            <div className="flex justify-between items-center text-[7px] md:text-[9px] font-black uppercase tracking-widest text-brand-muted">
                                <span>{record.checkIn ? formatTimeTo12Hour(record.checkIn) : '--:--'}</span>
                                <span className="opacity-50">-</span>
                                <span>{record.checkOut ? formatTimeTo12Hour(record.checkOut) : '--:--'}</span>
                            </div>
                            <div className="h-0.5 md:h-1 w-full bg-brand-border rounded-full overflow-hidden mt-0.5">
                                <div
                                    className={cn("h-full",
                                        record.status === 'Present' ? "bg-status-approved" :
                                            record.status === 'Late' ? "bg-brand-primary" : "bg-brand-muted"
                                    )}
                                    style={{ width: record.workHours ? `${Math.min((record.workHours / 9) * 100, 100)}%` : '0%' }}
                                />
                            </div>
                        </div>
                    )}

                    {record && record.isSynthetic && (
                        <div className="mt-auto absolute bottom-1 md:bottom-2 left-1 md:left-2 right-1 md:right-2">
                             <div className="text-center py-1 bg-status-rejected/10 rounded-lg border border-status-rejected/10">
                                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-tighter text-status-rejected opacity-80">Absent</span>
                             </div>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-2 md:p-6 shadow-sm overflow-hidden group">
                            <div className="grid grid-cols-7 mb-2 md:mb-4 text-center">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-brand-muted text-[8px] md:text-[10px] font-black uppercase tracking-widest py-1 md:py-2">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 md:gap-2">
                                {renderCalendar()}
                            </div>
                        </div>
                    </div>

                    {/* Stats & Insights Side Panel */}
                    <div className="space-y-6">
                        {/* Summary Insights */}
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 md:p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                <Sparkles className="w-4 h-4 text-brand-primary" />
                                <h3 className="text-sm font-black text-brand-text tracking-widest uppercase">Monthly Vita</h3>
                            </div>

                            {(() => {
                                const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                                const monthlyAttendance = Array.isArray(attendance) ? attendance.filter(r => r.date.startsWith(yearMonth)) : [];
                                
                                return (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 md:p-4 bg-status-approved/5 rounded-xl border border-status-approved/10">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="p-1.5 md:p-2 bg-status-approved/10 rounded-lg">
                                                    <CheckCircle className="w-3.5 h-3.5 md:w-4 h-4 text-status-approved" />
                                                </div>
                                                <span className="text-[10px] md:text-xs font-bold text-brand-text">Present</span>
                                            </div>
                                            <span className="text-xl md:text-2xl font-black text-status-approved">
                                                {monthlyAttendance.filter(r => r.status === 'Present').length}
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
                                                {monthlyAttendance.filter(r => r.status === 'Absent' || r.status === 'Leave').length}
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
                                                {monthlyAttendance.filter(r => r.status === 'Late' || r.status === 'Half Day').length}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-brand-primary/10 rounded-lg">
                                                    <Clock className="w-4 h-4 text-brand-primary" />
                                                </div>
                                                <span className="text-xs font-bold text-brand-text">Weekly Off</span>
                                            </div>
                                            <span className="text-2xl font-black text-brand-primary">
                                                {(() => {
                                                    const daysInMonth = getDaysInMonth(currentDate);
                                                    let sundays = 0;
                                                    for (let i = 1; i <= daysInMonth; i++) {
                                                        if (new Date(currentDate.getFullYear(), currentDate.getMonth(), i).getDay() === 0) sundays++;
                                                    }
                                                    return sundays;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Selected Day Expanded Details */}
                        {selectedDayStats ? (
                            <div className="bg-brand-surface border border-brand-primary/30 rounded-2xl p-4 md:p-6 shadow-md relative overflow-hidden">
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
                                                    (selectedDayStats as any).isWeeklyOff ? "text-brand-primary" :
                                                        "text-status-pending"
                                        )}>{(selectedDayStats as any).isWeeklyOff ? 'Weekly Off' : selectedDayStats.status}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-brand-bg p-3 rounded-xl border border-brand-border text-center">
                                            <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest block mb-1">In</span>
                                            <span className="text-xs font-black text-brand-text block">{formatTimeTo12Hour(selectedDayStats.checkIn)}</span>
                                            {selectedDayStats.workMode && (
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase mt-1 inline-block",
                                                    selectedDayStats.workMode === 'Work from Office' ? "text-brand-primary" : "text-[#5b3ae9]"
                                                )}>
                                                    {selectedDayStats.workMode === 'Work from Office' ? 'Office' : 'Remote'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-brand-bg p-3 rounded-xl border border-brand-border text-center">
                                            <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest block mb-1">Out</span>
                                            <span className="text-xs font-black text-brand-text block">{formatTimeTo12Hour(selectedDayStats.checkOut)}</span>
                                            {selectedDayStats.workLocation && (
                                                <span className="text-[8px] font-black text-brand-muted uppercase mt-1 inline-block">
                                                    {selectedDayStats.workLocation}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/10 flex flex-col items-center justify-center">
                                        <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-1">Work Hours</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-brand-primary tabular-nums">
                                                {calculateWorkingHours(selectedDayStats.checkIn, selectedDayStats.checkOut, selectedDayStats.workHours)}
                                            </span>
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
