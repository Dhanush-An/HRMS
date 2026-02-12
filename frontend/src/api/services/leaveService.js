import client from '../client';

const mapToBackend = (data) => ({
    employee_id: data.employeeId,
    leave_type: data.leaveType,
    start_date: data.startDate,
    end_date: data.endDate,
    days: data.days,
    reason: data.reason
});

const mapToFrontend = (data) => ({
    ...data,
    employeeId: data.employeeId || data.employee_id,
    leaveType: data.leaveType || data.leave_type,
    startDate: data.startDate || data.start_date,
    endDate: data.endDate || data.end_date,
    appliedOn: data.appliedOn || data.applied_on,
    approvedBy: data.approvedBy || data.approved_by,
    approvedOn: data.approvedOn || data.approved_on,
    employeeName: data.employeeName || 'Unknown Employee'
});

export const leaveService = {
    getAllLeaves: async () => {
        const response = await client.get('/leaves');
        return response.data.map(mapToFrontend);
    },
    createLeave: async (leaveData) => {
        const mappedData = mapToBackend(leaveData);
        const response = await client.post('/leaves', mappedData);
        return response.data;
    },
    updateLeaveStatus: async (id, statusData) => {
        const response = await client.put(`/leaves/${id}`, statusData);
        return response.data;
    },
    getEmployeeLeaves: async (employeeId) => {
        const response = await client.get(`/leaves/employee/${employeeId}`);
        return response.data.map(mapToFrontend);
    }
};
