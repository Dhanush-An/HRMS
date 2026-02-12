import React, { useState } from 'react';
import { Icons } from '../icons/Icons';

const LeaveRequestModal = ({ employees, onClose, onSubmit, isEmployee = false, currentUser }) => {
    const [formData, setFormData] = useState({
        employeeId: isEmployee ? currentUser?.id : '',
        employeeName: isEmployee ? currentUser?.name : '',
        leaveType: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        onSubmit({ ...formData, days });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <h3 className="text-2xl font-bold text-gray-800">Request Leave</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icons.X />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Employee</label>
                            {isEmployee ? (
                                <div className="relative">
                                    <input
                                        type="text"
                                        readOnly
                                        value={currentUser?.name || formData.employeeName}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50/50 text-gray-800 font-bold cursor-not-allowed outline-none"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Icons.ShieldCheck className="text-green-500" size={18} />
                                    </div>
                                </div>
                            ) : (
                                <select
                                    required
                                    value={formData.employeeId}
                                    onChange={(e) => {
                                        const emp = employees.find(emp => emp.id === parseInt(e.target.value));
                                        setFormData({ ...formData, employeeId: e.target.value, employeeName: emp?.name || '' });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type</label>
                            <select
                                required
                                value={formData.leaveType}
                                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option>Sick Leave</option>
                                <option>Casual Leave</option>
                                <option>Vacation</option>
                                <option>Unpaid Leave</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                            <textarea
                                required
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="Please provide a reason for your leave request..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveRequestModal;
