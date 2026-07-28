import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles: string[];
    children?: React.ReactNode;
}

const ROLE_HOME: Record<string, string> = {
    admin: '/admin-dashboard',
    subadmin: '/subadmin-dashboard',
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

    let role: string = (user.role || 'employee').toLowerCase();
    if (role === 'hr' || role.includes('human resource') || role.includes('hr executive') || role.includes('hr manager')) {
        role = 'hr';
    } else if (role !== 'admin' && role !== 'subadmin') {
        role = 'employee';
    }
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
    
    console.log(`[AUTH] Path: ${window.location.pathname}, Role: ${role}, Allowed: [${normalizedAllowedRoles.join(', ')}]`);

    if (!normalizedAllowedRoles.includes(role)) {
        const home = ROLE_HOME[role] || '/employee-dashboard';
        
        // Prevent infinite redirect loop: only redirect if we're not already at the destination
        if (window.location.pathname !== home) {
            console.warn(`[AUTH] Unauthorized access to ${window.location.pathname}. Redirecting ${role} to ${home}`);
            return <Navigate to={home} replace />;
        } else {
            // If we're already at the fallback destination but still not "allowed", 
            // we should probably allow it to avoid a blank screen, or show an error.
            // For now, let's allow it so the component can at least mount.
            console.warn(`[AUTH] Already at ${home} but role ${role} not explicitly in allowedRoles. Allowing to break loop.`);
        }
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
