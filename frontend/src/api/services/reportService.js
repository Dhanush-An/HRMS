import client from '../client';

export const reportService = {
    // Submit a new daily report
    submitReport: async (reportData) => {
        const response = await client.post('/reports', reportData);
        return response.data;
    },

    // Get all reports (Admin)
    getAllReports: async () => {
        const response = await client.get('/reports');
        return response.data;
    },

    // Get my reports (Employee)
    getMyReports: async () => {
        const response = await client.get('/reports/my-reports');
        return response.data;
    }
};
