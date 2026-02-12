import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { getInitials } from '../utils/utils';

const AttendanceManagement = ({ attendance, employees, currentUser, onCheckIn, onCheckOut }) => {
    const isEmployee = currentUser && currentUser.role !== 'HR Manager' && currentUser.role !== 'Admin';
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const displayAttendance = isEmployee
        ? attendance.filter(a => a.employeeId === currentUser.id)
        : attendance.filter(a => a.date === selectedDate);

    const todayAttendance = attendance.filter(a => a.date === selectedDate);

    const attendancePercentage = displayAttendance.length > 0
        ? Math.round((displayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length / displayAttendance.length) * 100)
        : 0;

    const handleDownloadReport = () => {
        const [year, month] = selectedDate.split('-');
        const monthYear = `${year}-${month}`;

        const monthAttendance = attendance.filter(a => a.date.startsWith(monthYear));

        if (monthAttendance.length === 0) {
            alert('No attendance data found for the selected month.');
            return;
        }

        const headers = ['Date', 'Employee Name', 'Employee ID', 'Department', 'Check In', 'Check Out', 'Status'];
        const csvRows = monthAttendance.map(record => {
            const employee = employees.find(e => e.id === record.employeeId);
            return [
                record.date,
                `"${record.employeeName || employee?.name || 'Unknown'}"`,
                `"${employee?.employeeId || 'N/A'}"`,
                `"${employee?.department || 'N/A'}"`,
                record.checkIn || '-',
                record.checkOut || '-',
                record.status
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Attendance_Report_${monthYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800">
                            {isEmployee ? 'My Attendance History' : 'Daily Attendance Management'}
                        </h3>
                        <p className="text-gray-500 font-medium mt-1">
                            {isEmployee ? 'Keep track of your daily check-in and check-out logs.' : 'Manage and monitor daily attendance records for all employees.'}
                        </p>
                    </div>

                    {isEmployee && (
                        <div className="flex items-center space-x-8 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-50 flex-1 max-w-md">
                            <div className="relative w-16 h-16 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="32" cy="32" r="28"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        className="text-gray-200"
                                    />
                                    <circle
                                        cx="32" cy="32" r="28"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        strokeDasharray={175.9}
                                        strokeDashoffset={175.9 - (175.9 * attendancePercentage) / 100}
                                        className="text-purple-600 transition-all duration-1000"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-gray-800">
                                    {attendancePercentage}%
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Attendance<br />Percentage</p>
                                <div className="mt-1 flex items-center space-x-2">
                                    <span className={`text-sm font-bold ${attendancePercentage >= 90 ? 'text-green-500' : 'text-amber-500'}`}>
                                        {attendancePercentage >= 90 ? 'High Compliance' : 'Review Required'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isEmployee && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center space-x-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
                                <Icons.Calendar className="text-gray-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent font-bold text-gray-700 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={handleDownloadReport}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl shadow-purple-100 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Icons.Download size={20} />
                                <span>Export Report</span>
                            </button>
                        </div>
                    )}
                </div>

                {!isEmployee && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-50/50 border border-green-100 rounded-[1.5rem] p-6 text-center">
                            <p className="text-green-800 text-xs font-bold uppercase tracking-widest mb-1">Present Today</p>
                            <p className="text-4xl font-black text-green-600">
                                {todayAttendance.filter(a => a.status === 'Present').length}
                            </p>
                        </div>
                        <div className="bg-rose-50/50 border border-rose-100 rounded-[1.5rem] p-6 text-center">
                            <p className="text-rose-800 text-xs font-bold uppercase tracking-widest mb-1">Absent Today</p>
                            <p className="text-4xl font-black text-rose-600">
                                {todayAttendance.filter(a => a.status === 'Absent').length}
                            </p>
                        </div>
                        <div className="bg-amber-50/50 border border-amber-100 rounded-[1.5rem] p-6 text-center">
                            <p className="text-amber-800 text-xs font-bold uppercase tracking-widest mb-1">Not Marked</p>
                            <p className="text-4xl font-black text-amber-600">
                                {employees.length - todayAttendance.length}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            {isEmployee ? (
                                <>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Check In</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Check Out</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Employee</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Check In</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Check Out</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isEmployee ? (
                            displayAttendance.length > 0 ? (
                                [...displayAttendance].sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5 font-bold text-gray-800">{record.date}</td>
                                        <td className="px-8 py-5 text-gray-600 font-semibold">{record.checkIn || '-'}</td>
                                        <td className="px-8 py-5 text-gray-600 font-semibold">{record.checkOut || '-'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${record.status === 'Present' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                record.status === 'Late' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                {record.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-4">
                                                <Icons.Clock size={32} />
                                            </div>
                                            <p className="text-gray-400 font-bold italic">No attendance records found for your account.</p>
                                        </div>
                                    </td>
                                </tr>
                            )
                        ) : (
                            employees.map(employee => {
                                const record = displayAttendance.find(a => a.employeeId === employee.id);
                                return (
                                    <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg transform group-hover:scale-110 transition-transform">
                                                    {getInitials(employee?.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{employee?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{employee?.employee_id || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-gray-700 font-bold">{record?.date || selectedDate}</td>
                                        <td className="px-8 py-5 text-gray-600 font-semibold">{record?.checkIn || '-'}</td>
                                        <td className="px-8 py-5 text-gray-600 font-semibold">{record?.checkOut || '-'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${record?.status === 'Present' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                record?.status === 'Late' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    record?.status === 'Absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                        'bg-gray-50 text-gray-300 border border-gray-100'
                                                }`}>
                                                {(record?.status || 'Not Marked').toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceManagement;
