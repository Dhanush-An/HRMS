module.exports = {
    host: process.env.MAIL_HOST || 'smtp.example.com',
    port: process.env.MAIL_PORT || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
};
