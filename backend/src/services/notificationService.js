const notificationService = {
    async sendEmail(to, subject, body) {
        console.log(`Sending email to ${to}: ${subject}`);
        // Integration with mail service placeholder
        return true;
    },

    async sendDashboardNotification(userId, message) {
        console.log(`Dashboard notification for ${userId}: ${message}`);
        return true;
    }
};

module.exports = notificationService;
