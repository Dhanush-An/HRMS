import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles: string[];
    children?: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        
        // If 'employee' is in allowed roles, we allow any role that isn't explicitly 'admin'
        const isAllowed = allowedRoles.includes(user.role) || (allowedRoles.includes('employee') && user.role !== 'admin');
        
        if (!isAllowed) {
            if (user.role === 'admin') {
                return <Navigate to="/admin-dashboard" replace />;
            } else {
                return <Navigate to="/employee-dashboard" replace />;
            }
        }
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
