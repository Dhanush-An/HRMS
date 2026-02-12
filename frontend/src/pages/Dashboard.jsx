import React, { useMemo } from 'react';
import StatCard from '../components/StatCard';
import RecentActivity from '../components/RecentActivity';
import DepartmentBreakdown from '../components/DepartmentBreakdown';
import { Icons } from '../icons/Icons';

const Dashboard = ({ employees, attendance, leaves, announcements }) => {
    const mandatoryDocList = [
        "Aadhar", "PAN", "10th Certificate", "12th Certificate", "Degree certificate's", "Offer Letter Acceptance"
    ];

    const stats = useMemo(() => {
        const pendingDocsEmployees = employees.filter(emp => {
            const empDocs = emp.documents || [];
            return mandatoryDocList.some(docName =>
                !empDocs.some(d => d.name.toLowerCase().includes(docName.toLowerCase()))
            );
        });

        return {
            totalEmployees: employees.length,
            activeEmployees: employees.filter(e => e.status === 'Active').length,
            presentToday: attendance.filter(a => a.status === 'Present').length,
            pendingLeaves: leaves.filter(l => l.status === 'Pending').length,
            documentCompliance: employees.length > 0
                ? (((employees.length - pendingDocsEmployees.length) / employees.length) * 100).toFixed(0) + '%'
                : '0%',
            pendingDocsCount: pendingDocsEmployees.length,
            pendingDocsList: pendingDocsEmployees.slice(0, 5) // Show top 5
        };
    }, [employees, attendance, leaves]);

    return (
        <div className="animate-fade-in">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees}
                    icon={<Icons.Users />}
                    color="from-blue-500 to-blue-600"
                />
                <StatCard
                    title="Document Compliance"
                    value={stats.documentCompliance}
                    icon={<Icons.FileText />}
                    color="from-indigo-500 to-indigo-600"
                />
                <StatCard
                    title="Present Today"
                    value={stats.presentToday}
                    icon={<Icons.Clock />}
                    color="from-purple-500 to-purple-600"
                />
                <StatCard
                    title="Pending Leaves"
                    value={stats.pendingLeaves}
                    icon={<Icons.Calendar />}
                    color="from-orange-500 to-orange-600"
                />
            </div>

            {/* Registration Requests Section Removed */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivity leaves={leaves} />
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Document Pending</h3>
                            <p className="text-xs text-gray-400 font-medium mt-1">{stats.pendingDocsCount} employees missing mandatory files</p>
                        </div>
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                            <Icons.AlertCircle size={20} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {stats.pendingDocsList.length > 0 ? (
                            stats.pendingDocsList.map((emp) => {
                                const missing = mandatoryDocList.filter(docName =>
                                    !(emp.documents || []).some(d => d.name.toLowerCase().includes(docName.toLowerCase()))
                                );
                                return (
                                    <div key={emp.id} className="group p-4 bg-gray-50/50 hover:bg-red-50 rounded-2xl border border-gray-50 hover:border-red-100 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 font-bold text-xs ring-1 ring-gray-100">
                                                    {(emp.name || 'User').split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-700">{emp.name || 'Unknown Employee'}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{emp.role || 'No Role'} • {emp.department || 'No Department'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-1 rounded-lg uppercase">
                                                    {missing.length} Missing
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-400 italic text-sm">All employees are fully compliant!</p>
                            </div>
                        )}
                    </div>
                </div>
                <DepartmentBreakdown employees={employees} />

                {/* Announcements Section */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Recent Announcements</h3>
                            <p className="text-xs text-gray-400 font-medium mt-1">Broadcasts for all employees</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                            <Icons.Megaphone size={20} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {announcements && announcements.length > 0 ? (
                            announcements.slice(0, 3).map((ann) => (
                                <div key={ann.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50 hover:border-purple-100 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`bg-${ann.color || 'purple'}-100 text-${ann.color || 'purple'}-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest`}>
                                            {ann.type}
                                        </span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">{ann.time}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 line-clamp-2">{ann.content}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-400 italic text-sm">No recent announcements</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
