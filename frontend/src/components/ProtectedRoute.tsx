import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles: string[];
    children?: React.ReactNode;
}

const ROLE_HOME: Record<string, string> = {
    admin: '/admin-dashboard',
    hr: '/hr-dashboard',
    employee: '/employee-dashboard',
    staff: '/employee-dashboard',
};

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // No session → login
    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    let user = null;
    try {
        if (userStr) {
            user = JSON.parse(userStr);
        }
    } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const role: string = (user.role || 'employee').toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowedRoles.includes(role)) {
        // Redirect to the user's own home instead of a 403
        const home = ROLE_HOME[role];
        
        if (home) {
            return <Navigate to={home} replace />;
        } else if (role !== 'admin' && role !== 'hr') {
            // New fallback: Any role that isn't admin or hr can access employee dashboard
            return <Navigate to="/employee-dashboard" replace />;
        } else {
            // Fallback for unknown roles: clear session and go to login to avoid loops
            console.error(`[AUTH] Unknown role: ${role}. Clearing session.`);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return <Navigate to="/login" replace />;
        }
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
