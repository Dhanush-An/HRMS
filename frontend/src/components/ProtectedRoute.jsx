import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAuthenticated, userRole, requiredRole }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        // Redirection logic if role doesn't match
        // For example, if an employee tries to access admin pages
        return <Navigate to={userRole === 'Admin' ? '/dashboard' : '/user-dashboard'} replace />;
    }

    return children;
};

export default ProtectedRoute;
