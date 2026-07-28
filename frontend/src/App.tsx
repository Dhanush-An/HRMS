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
import BranchManagers from './pages/admin/BranchManagers';
import Queries from './pages/admin/Queries';
import Recruitment from './pages/admin/Recruitment';
import HRDashboard from './pages/HRDashboard';
import HRPortal from './pages/hr/HRPortal';
import EmployeeHome from './pages/employee/EmployeeHome';
import EmployeeTasks from './pages/employee/EmployeeTasks';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeePerformance from './pages/employee/EmployeePerformance';
import EmployeeAnnouncements from './pages/employee/EmployeeAnnouncements';
import EmployeeDocuments from './pages/employee/EmployeeDocuments';
import CompanyPolicies from './pages/employee/CompanyPolicies';
import SubAdminSettings from './pages/subadmin/SubAdminSettings';
import EmployeePayroll from './pages/employee/EmployeePayroll';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeQueries from './pages/employee/EmployeeQueries';
import EmployeeExpenses from './pages/employee/EmployeeExpenses';
import AdminExpenses from './pages/admin/AdminExpenses';
import Branches from './pages/admin/Branches';
import SubAdminDashboard from './pages/SubAdminDashboard';
import SubAdminHome from './pages/subadmin/SubAdminHome';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalJobPopup from './components/GlobalJobPopup';
import JobsTab from './components/JobsTab';
import ResignationTab from './components/ResignationTab';
import Permissions from './pages/admin/Permissions';


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
        <GlobalJobPopup />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}>
            <Route index element={<AdminHome />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="expenses" element={<AdminExpenses />} />
            <Route path="performance" element={<Performance />} />
            <Route path="documents" element={<Documents />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="policies" element={<AdminPolicies />} />
            <Route path="reports" element={<Reports />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="hr" element={<HR />} />
            <Route path="branch-managers" element={<BranchManagers />} />
            <Route path="branches" element={<Branches />} />
            <Route path="hr-dashboard" element={<HRDashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="queries" element={<Queries />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="jobs" element={<JobsTab showAll />} />
            <Route path="resignation" element={<ResignationTab role="admin" />} />
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
            <Route path="permissions" element={<Permissions />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="queries" element={<EmployeeQueries />} />
            <Route path="expenses" element={<EmployeeExpenses />} />
            <Route path="jobs" element={<JobsTab />} />
            <Route path="resignation" element={<ResignationTab role="employee" />} />
          </Route>

          {/* HR Routes */}
          <Route path="/hr-dashboard" element={<ProtectedRoute allowedRoles={['hr', 'admin']}><HRPortal /></ProtectedRoute>}>
             <Route path="permissions" element={<Permissions />} />
          </Route>

          {/* Sub Admin Routes */}
          <Route path="/subadmin-dashboard" element={<ProtectedRoute allowedRoles={['subadmin']}><SubAdminDashboard /></ProtectedRoute>}>
            <Route index element={<SubAdminHome />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="expenses" element={<AdminExpenses />} />
            <Route path="performance" element={<Performance />} />
            <Route path="documents" element={<Documents />} />
            <Route path="hr" element={<HR />} />
            <Route path="settings" element={<SubAdminSettings />} />
            <Route path="jobs" element={<JobsTab showAll />} />
            <Route path="resignation" element={<ResignationTab role="subadmin" />} />
          </Route>

          {/* Legacy & Underscore Route Redirects */}
          <Route path="/admin_dashboard/*" element={<Navigate to="/admin-dashboard" replace />} />
          <Route path="/employee_dashboard/*" element={<Navigate to="/employee-dashboard" replace />} />
          <Route path="/subadmin_dashboard/*" element={<Navigate to="/subadmin-dashboard" replace />} />
          <Route path="/hr_dashboard/*" element={<Navigate to="/hr-dashboard" replace />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
