module.exports = {
    secret: process.env.JWT_SECRET || 'hrms_secret_key_default',
    expiresIn: '24h'
};
