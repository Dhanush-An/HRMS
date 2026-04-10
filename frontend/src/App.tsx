import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminHome from './pages/admin/AdminHome';
import Employees from './pages/admin/Employees';
import Attendance from './pages/admin/Attendance';
import Payroll from './pages/admin/Payroll';
import Leaves from './pages/admin/Leaves';
import Performance from './pages/admin/Performance';
import Documents from './pages/admin/Documents';
import Settings from './pages/admin/Settings';
import Reports from './pages/admin/Reports';
import Announcements from './pages/admin/Announcements';
import AdminPolicies from './pages/admin/AdminPolicies';
import HR from './pages/admin/HR';
import Queries from './pages/admin/Queries';
import HRDashboard from './pages/HRDashboard';
import HRPortal from './pages/hr/HRPortal';
import EmployeeHome from './pages/employee/EmployeeHome';
import EmployeeTasks from './pages/employee/EmployeeTasks';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeePerformance from './pages/employee/EmployeePerformance';
import EmployeeAnnouncements from './pages/employee/EmployeeAnnouncements';
import EmployeeDocuments from './pages/employee/EmployeeDocuments';
import CompanyPolicies from './pages/employee/CompanyPolicies';
import EmployeePayroll from './pages/employee/EmployeePayroll';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeQueries from './pages/employee/EmployeeQueries';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';



function App() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[GLOBAL_ERROR] Uncaught error:', event.error);
      console.error('[GLOBAL_ERROR] Message:', event.message);
      console.error('[GLOBAL_ERROR] Stack:', event.error?.stack);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}>
            <Route index element={<AdminHome />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="performance" element={<Performance />} />
            <Route path="documents" element={<Documents />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="policies" element={<AdminPolicies />} />
            <Route path="reports" element={<Reports />} />
            <Route path="hr" element={<HR />} />
            <Route path="hr-dashboard" element={<HRDashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="queries" element={<Queries />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee-dashboard" element={<ProtectedRoute allowedRoles={['employee', 'staff']}><EmployeeDashboard /></ProtectedRoute>}>
            <Route index element={<EmployeeHome />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="profile" element={<EmployeeProfile />} />
            <Route path="performance" element={<EmployeePerformance />} />
            <Route path="announcements" element={<EmployeeAnnouncements />} />
            <Route path="documents" element={<EmployeeDocuments />} />
            <Route path="policies" element={<CompanyPolicies />} />
            <Route path="payroll" element={<EmployeePayroll />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="queries" element={<EmployeeQueries />} />
          </Route>

          {/* HR Routes */}
          <Route path="/hr-dashboard" element={<ProtectedRoute allowedRoles={['hr', 'admin']}><HRPortal /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
