import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { getInitials } from '../utils/utils';

const EditPayrollModal = ({ record, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        base_salary: record.baseSalary || 0,
        allowances: record.allowances || 0,
        deductions: record.deductions || 0
    });

    const netPay = parseFloat(formData.base_salary) + parseFloat(formData.allowances) - parseFloat(formData.deductions);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 hover:rotate-90 transition-transform">
                        <Icons.X size={20} />
                    </button>
                    <h3 className="text-xl font-bold">Edit Payroll</h3>
                    <p className="text-purple-100 text-xs mt-1">Adjust salary components for {record.employeeName}</p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Salary</label>
                        <input
                            type="number"
                            value={formData.base_salary}
                            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Allowances</label>
                            <input
                                type="number"
                                value={formData.allowances}
                                onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deductions</label>
                            <input
                                type="number"
                                value={formData.deductions}
                                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-purple-800">New Net Pay</span>
                        <span className="text-lg font-black text-purple-600">
                            ₹{netPay.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <button
                        onClick={() => onSave(record.id, formData)}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const Payroll = ({ employees, payroll, currentUser, onGeneratePayroll, onUpdatePayroll }) => {
    const isEmployee = currentUser && currentUser.role !== 'HR Manager' && currentUser.role !== 'Admin';
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [editingRecord, setEditingRecord] = useState(null);

    const displayEmployees = isEmployee
        ? employees.filter(e => e.id === currentUser.id)
        : employees;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleRunPayroll = () => {
        onGeneratePayroll(parseInt(selectedMonth), parseInt(selectedYear));
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div></div>
                {!isEmployee && (
                    <div className="flex space-x-3">
                        <div className="flex space-x-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                {Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => 2020 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleRunPayroll}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 hover:shadow-lg transition-all"
                        >
                            <Icons.Dollar />
                            <span>Run Payroll</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                        <tr>
                            <th className="px-3 py-4 text-left font-black uppercase tracking-wider">Employee</th>
                            <th className="px-2 py-4 text-left font-black uppercase tracking-wider">Role</th>
                            <th className="px-2 py-4 text-right font-black uppercase tracking-wider">Base Salary</th>
                            <th className="px-2 py-4 text-right font-black uppercase tracking-wider">Allowances</th>
                            <th className="px-2 py-4 text-right font-black uppercase tracking-wider">Deductions</th>
                            <th className="px-2 py-4 text-right font-black uppercase tracking-wider">Net Pay</th>
                            <th className="px-2 py-4 text-center font-black uppercase tracking-wider">Status</th>
                            <th className="px-3 py-4 text-center font-black uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {displayEmployees.map(employee => {
                            const record = payroll.find(p => p.employeeId === employee.id && p.month === parseInt(selectedMonth) && p.year === parseInt(selectedYear));

                            if (!record) {
                                return (
                                    <tr key={employee.id} className="hover:bg-gray-50 opacity-60">
                                        <td className="px-3 py-4">
                                            <div className="flex items-center space-x-2 opacity-50">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold text-xs">
                                                    {getInitials(employee.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 leading-tight">{employee.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold leading-tight uppercase">{employee.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 py-4 text-xs text-gray-400 font-medium">{employee.role}</td>
                                        <td className="px-2 py-4 text-right text-gray-400">-</td>
                                        <td className="px-2 py-4 text-right text-gray-400">-</td>
                                        <td className="px-2 py-4 text-right text-gray-400">-</td>
                                        <td className="px-2 py-4 text-right text-gray-400">-</td>
                                        <td className="px-2 py-4 text-center">
                                            <span className="px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black tracking-widest border border-gray-100">
                                                PENDING
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 text-center text-gray-300 font-black">-</td>
                                    </tr>
                                );
                            }

                            return (
                                <tr key={employee.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs">
                                                {getInitials(employee.name)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 leading-tight">{employee.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold leading-tight uppercase">{employee.employeeId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 text-xs text-gray-600 font-medium">{employee.role}</td>
                                    <td className="px-2 py-4 text-right font-bold text-gray-800">{formatCurrency(record.baseSalary)}</td>
                                    <td className="px-2 py-4 text-right text-green-600 font-bold">+{formatCurrency(record.allowances)}</td>
                                    <td className="px-2 py-4 text-right text-red-600 font-bold">-{formatCurrency(record.deductions)}</td>
                                    <td className="px-2 py-4 text-right font-black text-gray-900">{formatCurrency(record.netPay)}</td>
                                    <td className="px-2 py-4 text-center">
                                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black tracking-widest border border-green-100">
                                            PAID
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <button className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="View Payslip">
                                                <Icons.FileText size={18} />
                                            </button>
                                            {!isEmployee && (
                                                <button
                                                    onClick={() => setEditingRecord(record)}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Edit Payroll"
                                                >
                                                    <Icons.Edit size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Compliance Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Tax Compliance
                    </h3>
                    <p className="text-sm text-gray-600">All TDS deductions are up to date for FY 2023-24.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Provident Fund
                    </h3>
                    <p className="text-sm text-gray-600">PF contributions filed successfully for last month.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        ESI Status
                    </h3>
                    <p className="text-sm text-gray-600">ESI payments processed. Next due date: 15th Mar.</p>
                </div>
            </div>

            {editingRecord && (
                <EditPayrollModal
                    record={editingRecord}
                    onClose={() => setEditingRecord(null)}
                    onSave={(id, data) => {
                        onUpdatePayroll(id, data);
                        setEditingRecord(null);
                    }}
                />
            )}
        </div>
    );
};

export default Payroll;
