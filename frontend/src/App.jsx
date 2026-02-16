import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { employeeService } from './api/services/employeeService';
import { attendanceService } from './api/services/attendanceService';
import { leaveService } from './api/services/leaveService';
import { payrollService } from './api/services/payrollService';
import { authService } from './api/services/authService';
import { announcementService } from './api/services/announcementService';
import { getInitials } from './utils/utils';

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium italic">INITIALIZING HRMS...</div>;
    }

    return (
        <Router>
            <AppRoutes
                isAuthenticated={isAuthenticated}
                userRole={userRole}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onLogout={handleLogout}
                onLogin={handleLogin}
                employees={employees}
                attendance={attendance}
                leaves={leaves}
                payroll={payroll}
                announcements={announcements}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onUpdateLeaveStatus={handleUpdateLeaveStatus}
                onRequestLeave={handleRequestLeave}
                onGeneratePayroll={handleGeneratePayroll}
                onUpdatePayroll={handleUpdatePayroll}
            />
        </Router>
    );
};

export default App;