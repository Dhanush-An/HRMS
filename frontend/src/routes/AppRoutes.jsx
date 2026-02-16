import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Dashboard from '../pages/Dashboard';
import EmployeeManagement from '../pages/EmployeeManagement';
import AttendanceManagement from '../pages/AttendanceManagement';
import LeaveManagement from '../pages/LeaveManagement';
import Payroll from '../pages/Payroll';
import UserDashboard from '../pages/UserDashboard';
import Login from '../pages/Login';
import Announcements from '../pages/Announcements';
import DailyReport from '../pages/DailyReport';
import Policies from '../pages/Policies';
import Documents from '../pages/Documents';
import Profile from '../pages/Profile';
import { Icons } from '../icons/Icons';
import { getInitials } from '../utils/utils';

const AppRoutes = ({
    isAuthenticated,
    userRole,
    activeTab,
    setActiveTab,
    currentUser,
    onLogout,
    onLogin,
    employees,
    attendance,
    leaves,
    payroll,
    announcements,
    onAddEmployee,
    onUpdateEmployee,
    onDeleteEmployee,
    onCheckIn,
    onCheckOut,
    onUpdateLeaveStatus,
    onRequestLeave,
    onGeneratePayroll,
    onUpdatePayroll
}) => {
    const adminTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: <Icons.Chart /> },
        { id: 'daily-report', label: 'Daily Report', icon: <Icons.FileText size={20} /> },
        { id: 'announcements', label: 'Announcements', icon: <Icons.Megaphone size={20} /> },
        { id: 'employees', label: 'Employees', icon: <Icons.Users /> },
        { id: 'attendance', label: 'Attendance', icon: <Icons.Clock /> },
        { id: 'leaves', label: 'Leave Management', icon: <Icons.Calendar /> },
        { id: 'payroll', label: 'Payroll', icon: <Icons.Dollar /> },
        { id: 'policies', label: 'Company Policies', icon: <Icons.ShieldCheck size={20} /> },
        { id: 'documents', label: 'Documents', icon: <Icons.FileText size={20} /> }
    ];

    const employeeTabs = [
        { id: 'user-dashboard', label: 'Dashboard', icon: <Icons.Chart /> },
        { id: 'daily-report', label: 'Daily Report', icon: <Icons.FileText size={20} /> },
        { id: 'attendance', label: 'My Attendance', icon: <Icons.Clock /> },
        { id: 'leaves', label: 'My Leaves', icon: <Icons.Calendar /> },
        { id: 'payroll', label: 'My Payroll', icon: <Icons.Dollar /> },
        { id: 'announcements', label: 'Announcements', icon: <Icons.Megaphone size={20} /> },
        { id: 'policies', label: 'Company Policies', icon: <Icons.ShieldCheck size={20} /> },
        { id: 'documents', label: 'Documents', icon: <Icons.FileText size={20} /> }
    ];

    return (
        <Routes>
            {/* Public Route */}
            <Route
                path="/login"
                element={!isAuthenticated ? <Login onLogin={onLogin} /> : <Navigate to="/" replace />}
            />

            {/* Secure Main Application */}
            <Route path="/*" element={
                !isAuthenticated ? (
                    <Navigate to="/login" replace />
                ) : (
                    <div className="flex h-screen overflow-hidden bg-gray-50">
                        <Sidebar
                            adminTabs={userRole === 'Admin' ? adminTabs : employeeTabs}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            currentUser={currentUser}
                            onLogout={onLogout}
                            getInitials={getInitials}
                        />
                        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-10">
                                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                                    {(userRole === 'Admin' ? adminTabs : employeeTabs).find(tab => tab.id === activeTab)?.label || 'Dashboard'}
                                </h2>

                                <div className="tab-content transition-all duration-300">
                                    {userRole === 'Admin' ? (
                                        <div key="admin-view-root">
                                            {activeTab === 'dashboard' && <Dashboard
                                                employees={employees}
                                                attendance={attendance}
                                                leaves={leaves}
                                                announcements={announcements}
                                            />}
                                            {activeTab === 'daily-report' && <DailyReport />}
                                            {activeTab === 'announcements' && <Announcements currentUser={currentUser} />}
                                            {activeTab === 'employees' && <EmployeeManagement employees={employees} onAdd={onAddEmployee} onUpdate={onUpdateEmployee} onDelete={onDeleteEmployee} />}
                                            {activeTab === 'attendance' && <AttendanceManagement attendance={attendance} employees={employees} onCheckIn={onCheckIn} onCheckOut={onCheckOut} />}
                                            {activeTab === 'leaves' && <LeaveManagement leaves={leaves} employees={employees} currentUser={currentUser} isEmployee={false} onUpdateStatus={onUpdateLeaveStatus} onRequestLeave={onRequestLeave} />}
                                            {activeTab === 'payroll' && <Payroll employees={employees} payroll={payroll} onGeneratePayroll={onGeneratePayroll} onUpdatePayroll={onUpdatePayroll} />}
                                            {activeTab === 'policies' && <Policies />}
                                            {activeTab === 'documents' && <Documents employees={employees} currentUser={currentUser} onUpdateEmployee={onUpdateEmployee} />}
                                            {activeTab === 'user-profile' && <Profile currentUser={currentUser} onUpdateEmployee={onUpdateEmployee} />}
                                        </div>
                                    ) : (
                                        <div key="employee-view-root">
                                            {activeTab === 'user-dashboard' && <UserDashboard currentUser={currentUser} attendance={attendance} leaves={leaves} announcements={announcements} onCheckIn={onCheckIn} onCheckOut={onCheckOut} onRequestLeave={onRequestLeave} onNavigate={setActiveTab} />}
                                            {activeTab === 'daily-report' && <DailyReport />}
                                            {activeTab === 'attendance' && <AttendanceManagement attendance={attendance} employees={employees} currentUser={currentUser} onCheckIn={onCheckIn} onCheckOut={onCheckOut} />}
                                            {activeTab === 'leaves' && <LeaveManagement leaves={leaves} employees={employees} currentUser={currentUser} isEmployee={true} onUpdateStatus={onUpdateLeaveStatus} onRequestLeave={onRequestLeave} />}
                                            {activeTab === 'payroll' && <Payroll employees={employees} payroll={payroll} currentUser={currentUser} onGeneratePayroll={onGeneratePayroll} />}
                                            {activeTab === 'announcements' && <Announcements currentUser={currentUser} />}
                                            {activeTab === 'policies' && <Policies />}
                                            {activeTab === 'documents' && <Documents employees={employees} currentUser={currentUser} onUpdateEmployee={onUpdateEmployee} />}
                                            {activeTab === 'user-profile' && <Profile currentUser={currentUser} onUpdateEmployee={onUpdateEmployee} />}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            } />
        </Routes>
    );
};

export default AppRoutes;
