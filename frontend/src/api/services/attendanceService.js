import client from '../client';

const mapToFrontend = (data) => ({
    ...data,
    employeeId: data.employee_id || data.employeeId,
    checkIn: data.check_in || data.checkIn,
    checkOut: data.check_out || data.checkOut,
    employeeName: data.employeeName || data.employee_name
});

export const attendanceService = {
    getAllAttendance: async () => {
        const response = await client.get('/attendance');
        return response.data.map(mapToFrontend);
    },
    clockIn: async (employeeId) => {
        const response = await client.post('/attendance/checkin', { employee_id: employeeId });
        return response.data;
    },
    clockOut: async (employeeId) => {
        const response = await client.post('/attendance/checkout', { employee_id: employeeId });
        return response.data;
    },
    getEmployeeAttendance: async (employeeId) => {
        const response = await client.get(`/attendance/employee/${employeeId}`);
        return response.data.map(mapToFrontend);
    }
};
