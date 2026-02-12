const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const adminOnly = (req, res, next) => {
    const rawRole = req.user?.role;
    const role = String(rawRole || '').toLowerCase().trim();

    console.log(`[Auth] adminOnly check - User: ${req.user?.email}, Role: "${rawRole}", Normalized: "${role}"`);

    if (role !== 'admin' && role !== 'hr manager') {
        console.warn(`[Auth] Access denied for ${req.user?.email}. Role "${role}" is not authorized.`);
        return res.status(403).json({ message: `Access denied: Role "${rawRole}" is not authorized for this action.` });
    }
    next();
};

const adminOrSelf = (req, res, next) => {
    const isSelf = String(req.user?.id) === String(req.params.id);
    const role = String(req.user?.role || '').toLowerCase().trim();
    const isAdmin = role === 'admin' || role === 'hr manager';

    if (!isAdmin && !isSelf) {
        return res.status(403).json({ message: 'Access denied: You can only update your own record or require admin privileges' });
    }
    next();
};

module.exports = { authMiddleware, adminOnly, adminOrSelf };
