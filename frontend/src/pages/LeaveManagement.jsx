import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import LeaveRequestModal from '../components/LeaveRequestModal';

const LeaveManagement = ({ leaves, employees, currentUser, isEmployee: isEmployeeProp, onUpdateStatus, onRequestLeave }) => {
    // Determine isEmployee status: Prefer explicit prop, fallback to role check
    const isEmployee = isEmployeeProp !== undefined
        ? isEmployeeProp
        : (currentUser && currentUser.role !== 'HR Manager' && currentUser.role !== 'Admin');

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');

    const myLeaves = isEmployee ? leaves.filter(l => String(l.employeeId) === String(currentUser?.id)) : leaves;

    const filteredLeaves = filterStatus === 'All'
        ? myLeaves
        : myLeaves.filter(l => l.status === filterStatus);

    return (
        <div className="animate-fade-in">
            {/* Leave Policy Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-start space-x-4 shadow-sm">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-blue-100 mt-0.5">
                    <Icons.ShieldCheck className="text-blue-600 animate-pulse-slow" size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-blue-900 font-bold text-lg mb-1 flex items-center">
                        Leave Policy Guidelines
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <section className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                            <p className="text-blue-800/80 text-sm leading-relaxed font-medium">
                                <span className="text-blue-900 font-bold">Planned Absence:</span> Submit requests at least <span className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-bold">48 hours</span> in advance.
                            </p>
                        </section>
                        <section className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                            <p className="text-indigo-800/80 text-sm leading-relaxed font-medium">
                                <span className="text-indigo-900 font-bold">Sick Leave:</span> Report by <span className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-900 font-bold">8:00 AM</span> on the day of absence.
                            </p>
                        </section>
                    </div>
                </div>
                <button
                    onClick={() => setShowRequestModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 hover:shadow-xl hover:shadow-purple-100 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-lg whitespace-nowrap"
                >
                    <Icons.Plus size={20} />
                    <span>Request Leave</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex items-center justify-between">
                <div className="flex space-x-2 p-1">
                    {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${filterStatus === status
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="table-header">
                        <tr>
                            <th className="px-6 py-4 text-left">Employee</th>
                            <th className="px-6 py-4 text-left">Leave Type</th>
                            <th className="px-6 py-4 text-left">Start Date</th>
                            <th className="px-6 py-4 text-left">End Date</th>
                            <th className="px-6 py-4 text-left">Days</th>
                            <th className="px-6 py-4 text-left">Status</th>
                            {!isEmployee && <th className="px-6 py-4 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredLeaves.map(leave => {
                            // Robust name resolution
                            const resolvedName = leave.employeeName && leave.employeeName !== 'Unknown'
                                ? leave.employeeName
                                : employees.find(e => String(e.id) === String(leave.employeeId))?.name || 'Unknown Employee';

                            return (
                                <tr key={leave.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800">{resolvedName}</p>
                                        <p className="text-sm text-gray-500">{leave.reason}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{leave.leaveType}</td>
                                    <td className="px-6 py-4 text-gray-700">{leave.startDate}</td>
                                    <td className="px-6 py-4 text-gray-700">{leave.endDate}</td>
                                    <td className="px-6 py-4 text-gray-700">{leave.days}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    {!isEmployee && (
                                        <td className="px-6 py-4">
                                            {leave.status === 'Pending' && (
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        onClick={() => onUpdateStatus(leave.id, 'Approved')}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center space-x-1"
                                                    >
                                                        <Icons.Check />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button
                                                        onClick={() => onUpdateStatus(leave.id, 'Rejected')}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center space-x-1"
                                                    >
                                                        <Icons.X />
                                                        <span>Reject</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showRequestModal && (
                <LeaveRequestModal
                    employees={employees}
                    isEmployee={isEmployee}
                    currentUser={currentUser}
                    onClose={() => setShowRequestModal(false)}
                    onSubmit={(newLeave) => {
                        onRequestLeave(newLeave);
                        setShowRequestModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default LeaveManagement;
