import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import LeaveManagement from './pages/LeaveManagement';
import Payroll from './pages/Payroll';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Announcements from './pages/Announcements';
import DailyReport from './pages/DailyReport';
import Policies from './pages/Policies';
import Documents from './pages/Documents';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import { Icons } from './icons/Icons';
import { employeeService } from './api/services/employeeService';
import { attendanceService } from './api/services/attendanceService';
import { leaveService } from './api/services/leaveService';
import { payrollService } from './api/services/payrollService';
import { authService } from './api/services/authService';
import { announcementService } from './api/services/announcementService';
import { getInitials } from './utils/utils';
import logo from './assets/logo.svg';

const Sidebar = ({ adminTabs, activeTab, setActiveTab, currentUser, onLogout }) => (
    <div className="w-64 bg-white shadow-xl h-screen flex flex-col border-r border-gray-200">
        <div className="p-8 pb-4 flex items-center space-x-3">
            <img src={logo} alt="Antigraviity Logo" className="w-10 h-10 rounded-xl shadow-lg border border-gray-100" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Antigraviity
            </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {adminTabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600'
                        }`}
                >
                    <span className={`transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                        {tab.icon}
                    </span>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{tab.label}</span>
                </button>
            ))}
        </nav>

        <div className="p-4 mt-auto">
            <div
                onClick={() => setActiveTab('user-profile')}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 flex items-center space-x-3 border border-gray-200 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group/profile"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden group-hover/profile:scale-110 transition-transform">
                    {currentUser.photo ? (
                        <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                        getInitials(currentUser.name)
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate group-hover/profile:text-purple-600 transition-colors">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium truncate">{currentUser.role}</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onLogout();
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Logout"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
);

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [userRole, setUserRole] = useState('Admin'); // 'Admin' or 'Employee'
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loggedInEmployee, setLoggedInEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const userStr = localStorage.getItem('user');

            if (token && role) {
                const lowerRole = role.toLowerCase();
                const normalizedRole = (lowerRole === 'admin' || lowerRole === 'hr manager') ? 'Admin' : 'Employee';
                setUserRole(normalizedRole);
                setIsAuthenticated(true);
                setActiveTab(normalizedRole === 'Admin' ? 'dashboard' : 'user-dashboard');

                if (userStr) {
                    try {
                        setLoggedInEmployee(JSON.parse(userStr));
                    } catch (e) {
                        console.error('Error parsing persisted user:', e);
                        localStorage.removeItem('user');
                    }
                }
            }
        } catch (error) {
            console.error('Initialization error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAllData();

            // Set up automatic data polling (every 10 seconds)
            const intervalId = setInterval(() => {
                fetchAllData();
            }, 10000);

            return () => clearInterval(intervalId);
        }
    }, [isAuthenticated]);

    const fetchAllData = async () => {
        try {
            // Fetch everything individually to avoid one failure blocking all
            try {
                const empData = await employeeService.getAllEmployees();
                setEmployees(empData || []);
            } catch (e) { console.error('Error fetching employees:', e); }

            try {
                const attData = await attendanceService.getAllAttendance();
                setAttendance(attData || []);
            } catch (e) { console.error('Error fetching attendance:', e); }

            try {
                const leaveData = await leaveService.getAllLeaves();
                setLeaves(leaveData || []);
            } catch (e) { console.error('Error fetching leaves:', e); }

            try {
                const payrollData = await payrollService.getAllPayroll();
                setPayroll(payrollData || []);
            } catch (e) { console.error('Error fetching payroll:', e); }

            try {
                const annData = await announcementService.getAllAnnouncements();
                setAnnouncements(annData || []);
            } catch (e) { console.error('Error fetching announcements:', e); }

            // Pending registrations logic removed as per request
        } catch (error) {
            console.error('Core polling error:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const data = await employeeService.getAllEmployees();
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const currentUser = useMemo(() => {
        if (userRole === 'Admin') {
            const adminData = employees.find(emp =>
                String(emp.id) === '4' ||
                emp.email === 'admin@hrms.com' ||
                emp.email === 'david.k@company.com'
            );
            const fallbackAdmin = {
                id: 4,
                name: "David Kumar",
                role: "HR Manager",
                avatar: "DK",
                department: "Human Resources",
                email: "david.k@company.com"
            };
            return adminData || fallbackAdmin;
        }

        // Find full data in the employees list, ensuring ID comparison is robust
        const fullEmployeeData = employees.find(emp =>
            String(emp.id) === String(loggedInEmployee?.id)
        );

        const fallbackEmployee = { id: 2, name: "Michael Chen", role: "Product Manager", avatar: "MC" };
        return fullEmployeeData || loggedInEmployee || fallbackEmployee;
    }, [userRole, employees, loggedInEmployee]);

    const handleLogin = (rawRole, employeeData) => {
        try {
            const role = String(rawRole).toLowerCase() === 'admin' ? 'Admin' : 'Employee';
            setUserRole(role);
            setIsAuthenticated(true);
            setActiveTab(role === 'Admin' ? 'dashboard' : 'user-dashboard');
            if (role === 'Employee' && employeeData) {
                setLoggedInEmployee(employeeData);
            }
        } catch (error) {
            console.error('Login processing error:', error);
        }
    };

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUserRole('Admin');
        setLoggedInEmployee(null);
    };

    const handleAddEmployee = async (newEmployee) => {
        try {
            await employeeService.createEmployee({
                ...newEmployee,
                avatar: getInitials(newEmployee.name)
            });
            await fetchEmployees();
        } catch (error) {
            console.error('Error adding employee:', error);
        }
    };

    const handleUpdateEmployee = async (updatedEmployee) => {
        try {
            await employeeService.updateEmployee(updatedEmployee.id, updatedEmployee);
            await fetchEmployees();

            if (loggedInEmployee && String(loggedInEmployee.id) === String(updatedEmployee.id)) {
                const refreshedEmployee = await employeeService.getEmployeeById(updatedEmployee.id);
                setLoggedInEmployee(refreshedEmployee);
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            alert(error.response?.data?.message || 'Failed to update employee. Please try again.');
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await employeeService.deleteEmployee(id);
                await fetchEmployees();
            } catch (error) {
                console.error('Error deleting employee:', error);
            }
        }
    };

    const handleCheckIn = async () => {
        try {
            await attendanceService.clockIn(currentUser.id);
            const attData = await attendanceService.getAllAttendance();
            setAttendance(attData);
        } catch (error) {
            console.error('Error clocking in:', error);
            alert(error.response?.data?.message || 'Error clocking in');
        }
    };

    const handleCheckOut = async () => {
        try {
            await attendanceService.clockOut(currentUser.id);
            const attData = await attendanceService.getAllAttendance();
            setAttendance(attData);
        } catch (error) {
            console.error('Error clocking out:', error);
            alert(error.response?.data?.message || 'Error clocking out');
        }
    };

    const handleRequestLeave = async (leaveData) => {
        try {
            await leaveService.createLeave({
                ...leaveData,
                employeeId: leaveData.employeeId || currentUser.id
            });
            const updatedLeaves = await leaveService.getAllLeaves();
            setLeaves(updatedLeaves);
        } catch (error) {
            console.error('Error requesting leave:', error);
        }
    };

    const handleUpdateLeaveStatus = async (id, status) => {
        try {
            await leaveService.updateLeaveStatus(id, { status, approved_by: currentUser.id });
            const updatedLeaves = await leaveService.getAllLeaves();
            setLeaves(updatedLeaves);
        } catch (error) {
            console.error('Error updating leave status:', error);
        }
    };

    const handleGeneratePayroll = async (month, year) => {
        try {
            await payrollService.generatePayroll(month, year);
            const updatedPayroll = await payrollService.getAllPayroll();
            setPayroll(updatedPayroll);
        } catch (error) {
            console.error('Error generating payroll:', error);
        }
    };

    const handleUpdatePayroll = async (id, updatedData) => {
        try {
            await payrollService.updatePayroll(id, updatedData);
            const updatedPayroll = await payrollService.getAllPayroll();
            setPayroll(updatedPayroll);
        } catch (error) {
            console.error('Error updating payroll:', error);
            const message = error.response?.data?.message || 'Failed to update payroll. Please check the values and try again.';
            alert(message);
        }
    };

    // Registration approval handlers removed

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium italic">INITIALIZING HRMS...</div>;
    }

    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route
                    path="/login"
                    element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />}
                />
                {/* Signup Route Removed */}

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
                                onLogout={handleLogout}
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
                                                {activeTab === 'employees' && <EmployeeManagement employees={employees} onAdd={handleAddEmployee} onUpdate={handleUpdateEmployee} onDelete={handleDeleteEmployee} />}
                                                {activeTab === 'attendance' && <AttendanceManagement attendance={attendance} employees={employees} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} />}
                                                {activeTab === 'leaves' && <LeaveManagement leaves={leaves} employees={employees} currentUser={currentUser} isEmployee={false} onUpdateStatus={handleUpdateLeaveStatus} onRequestLeave={handleRequestLeave} />}
                                                {activeTab === 'payroll' && <Payroll employees={employees} payroll={payroll} onGeneratePayroll={handleGeneratePayroll} onUpdatePayroll={handleUpdatePayroll} />}
                                                {activeTab === 'policies' && <Policies />}
                                                {activeTab === 'documents' && <Documents employees={employees} currentUser={currentUser} onUpdateEmployee={handleUpdateEmployee} />}
                                                {activeTab === 'user-profile' && <Profile currentUser={currentUser} onUpdateEmployee={handleUpdateEmployee} />}
                                            </div>
                                        ) : (
                                            <div key="employee-view-root">
                                                {activeTab === 'user-dashboard' && <UserDashboard currentUser={currentUser} attendance={attendance} leaves={leaves} announcements={announcements} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} onRequestLeave={handleRequestLeave} onNavigate={setActiveTab} />}
                                                {activeTab === 'daily-report' && <DailyReport />}
                                                {activeTab === 'attendance' && <AttendanceManagement attendance={attendance} employees={employees} currentUser={currentUser} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} />}
                                                {activeTab === 'leaves' && <LeaveManagement leaves={leaves} employees={employees} currentUser={currentUser} isEmployee={true} onUpdateStatus={handleUpdateLeaveStatus} onRequestLeave={handleRequestLeave} />}
                                                {activeTab === 'payroll' && <Payroll employees={employees} payroll={payroll} currentUser={currentUser} onGeneratePayroll={handleGeneratePayroll} />}
                                                {activeTab === 'announcements' && <Announcements currentUser={currentUser} />}
                                                {activeTab === 'policies' && <Policies />}
                                                {activeTab === 'documents' && <Documents employees={employees} currentUser={currentUser} onUpdateEmployee={handleUpdateEmployee} />}
                                                {activeTab === 'user-profile' && <Profile currentUser={currentUser} onUpdateEmployee={handleUpdateEmployee} />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                } />
            </Routes>
        </Router>
    );
};

export default App;