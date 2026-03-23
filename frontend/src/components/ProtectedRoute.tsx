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

    const role: string = user.role || 'employee';

    if (!allowedRoles.includes(role)) {
        // Redirect to the user's own home instead of a 403
        const home = ROLE_HOME[role] || '/login';
        return <Navigate to={home} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
