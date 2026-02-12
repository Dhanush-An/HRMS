import React, { useMemo, useState } from 'react';
import StatCard from '../components/StatCard';
import { Icons } from '../icons/Icons';
import { getInitials } from '../utils/utils';
import LeaveRequestModal from '../components/LeaveRequestModal';

const UserDashboard = ({ currentUser, attendance, leaves, announcements, onCheckIn, onCheckOut, onRequestLeave, onNavigate }) => {
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const todayRecord = attendance.find(a =>
        String(a.employeeId) === String(currentUser.id) &&
        a.date === new Date().toISOString().split('T')[0]
    );

    const stats = useMemo(() => {
        const myAttendance = attendance.filter(a => String(a.employeeId) === String(currentUser.id));
        const myLeaves = [...leaves].filter(l => String(l.employeeId) === String(currentUser.id));

        // Get the latest leave request (highest ID or most recent data)
        const latestLeave = myLeaves.sort((a, b) => b.id - a.id)[0];

        return {
            presentDays: myAttendance.filter(a => a.status === 'Present').length,
            lateDays: myAttendance.filter(a => a.status === 'Late').length,
            absentDays: myAttendance.filter(a => a.status === 'Absent').length,
            leaveBalance: currentUser.leave_allowance || { casual: 12, sick: 8, earned: 15 },
            pendingRequests: myLeaves.filter(l => l.status === 'Pending').length,
            latestLeave: latestLeave
        };
    }, [attendance, leaves, currentUser]);

    return (
        <div className="animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Welcome, {(currentUser?.name || 'User').split(' ')[0]}!
                    </h2>
                    <p className="text-gray-500 font-medium">Have a productive day at the office.</p>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Check In/Out Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={onCheckIn}
                            disabled={todayRecord?.checkIn}
                            className={`p-3 rounded-2xl transition-all duration-300 border ${todayRecord?.checkIn
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                : 'bg-white text-green-600 border-green-100 hover:bg-green-50 hover:border-green-200 hover:shadow-md cursor-pointer'
                                }`}
                            title="Check In"
                        >
                            <Icons.LogIn size={24} />
                        </button>
                        <button
                            onClick={onCheckOut}
                            disabled={!todayRecord?.checkIn || todayRecord?.checkOut}
                            className={`p-3 rounded-2xl transition-all duration-300 border ${!todayRecord?.checkIn || todayRecord?.checkOut
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                : 'bg-white text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200 hover:shadow-md cursor-pointer'
                                }`}
                            title="Check Out"
                        >
                            <Icons.LogOut size={24} />
                        </button>
                    </div>

                    <div className="bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 shadow-inner flex space-x-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Login</span>
                            <span className="font-bold text-gray-800">
                                {todayRecord?.checkIn ? new Date(`1970-01-01T${todayRecord.checkIn}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logout</span>
                            <span className="font-bold text-gray-800">
                                {todayRecord?.checkOut ? new Date(`1970-01-01T${todayRecord.checkOut}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Announcement Card */}
            {announcements && announcements.length > 0 && (
                <div
                    onClick={() => onNavigate('announcements')}
                    className="mb-8 bg-white border border-gray-100 p-5 rounded-2xl flex items-center shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center space-x-6 flex-1">
                        <div className={`p-4 bg-${announcements[0].color || 'amber'}-50 text-${announcements[0].color || 'amber'}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                            <Icons.Megaphone size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black text-${announcements[0].color || 'amber'}-600 uppercase tracking-widest leading-none mb-2 flex items-center space-x-2`}>
                                <span>{announcements[0].type}</span>
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>
                                <span className="text-gray-300 ml-2">{announcements[0].time}</span>
                            </p>
                            <p className="text-lg font-bold text-gray-700 italic line-clamp-1">
                                "{announcements[0].content}"
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex ml-6 px-5 py-2.5 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-100 group-hover:bg-purple-50 group-hover:text-purple-600 group-hover:border-purple-100 transition-colors shadow-sm">
                        View All →
                    </div>
                </div>
            )}

            {showLeaveModal && (
                <LeaveRequestModal
                    isEmployee={true}
                    currentUser={currentUser}
                    onClose={() => setShowLeaveModal(false)}
                    onSubmit={(data) => {
                        onRequestLeave(data);
                        setShowLeaveModal(false);
                    }}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* 2. Attendance Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                            <span className="p-2 bg-green-50 text-green-600 rounded-lg"><Icons.Chart /></span>
                            <span>Attendance Overview</span>
                        </h3>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider">This Month</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.presentDays}</p>
                            <p className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Present</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                            <p className="text-2xl font-bold text-orange-600">{stats.lateDays}</p>
                            <p className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">Late</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                            <p className="text-2xl font-bold text-red-600">{stats.absentDays}</p>
                            <p className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Absent</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[140px] bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-4">
                        <p className="text-sm font-bold text-gray-800 mb-1">Status: {todayRecord?.checkIn ? 'Punctual' : 'Not Started'}</p>
                        <p className="text-xs text-gray-500 text-center">Daily average productivity 94%</p>
                        <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[94%]"></div>
                        </div>
                    </div>
                </div>

                {/* 3. Leave Management */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Calendar /></span>
                            <span>Leave Management</span>
                        </h3>
                        <button onClick={() => setShowLeaveModal(true)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                            <Icons.Plus />
                        </button>
                    </div>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-semibold text-gray-600">Casual Leaves</span>
                            <span className="font-bold text-gray-800">{stats.leaveBalance.casual} Days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-semibold text-gray-600">Sick Leaves</span>
                            <span className="font-bold text-gray-800">{stats.leaveBalance.sick} Days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-semibold text-gray-600">Earned Leaves</span>
                            <span className="font-bold text-gray-800">{stats.leaveBalance.earned} Days</span>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">Recent Status</p>
                        {stats.latestLeave ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">{stats.latestLeave.leaveType}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stats.latestLeave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                    stats.latestLeave.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {stats.latestLeave.status.toUpperCase()}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 text-gray-400">
                                <span className="text-xs italic">No recent requests</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Payroll Snapshot */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Icons.Chart /></span>
                            <span>Payroll Snapshot</span>
                        </h3>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl text-white mb-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Take Home</p>
                        <p className="text-3xl font-bold">₹{((currentUser.payroll_details?.base_salary || 0) - (currentUser.payroll_details?.tax_deductions || 0)).toLocaleString('en-IN')}</p>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>Base: ₹{(currentUser.payroll_details?.base_salary || 0).toLocaleString('en-IN')}</span>
                            <span>Tax: -₹{(currentUser.payroll_details?.tax_deductions || 0).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <button className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-bold flex items-center justify-center space-x-2 border border-gray-100 hover:bg-gray-100 transition-all">
                        <Icons.FileText />
                        <span>Download Payslip</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UserDashboard;
