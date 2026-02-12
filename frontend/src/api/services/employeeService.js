import client from '../client';

const mapToBackend = (data) => {
    // Preserve all existing fields (like tasks, payroll, etc.)
    const mapped = { ...data };

    // Map frontend specific camelCase fields to backend snake_case
    if (data.reportingTo !== undefined) mapped.reporting_to = data.reportingTo;
    if (data.joiningDate !== undefined) mapped.joining_date = data.joiningDate;
    if (data.employeeId !== undefined) mapped.employee_id = data.employeeId;

    // Remove the camelCase versions to keep backend clean if desired, 
    // or just leave them if the backend handles extra fields (which it does via spread).
    delete mapped.reportingTo;
    delete mapped.joiningDate;
    delete mapped.employeeId;

    return mapped;
};

const mapToFrontend = (data) => ({
    ...data,
    joiningDate: data.joining_date,
    employeeId: data.employee_id,
    reportingTo: data.reporting_to
});

export const employeeService = {
    getAllEmployees: async () => {
        const response = await client.get('/employees');
        return response.data.map(mapToFrontend);
    },
    getEmployeeById: async (id) => {
        const response = await client.get(`/employees/${id}`);
        return mapToFrontend(response.data);
    },
    createEmployee: async (employeeData) => {
        const mappedData = mapToBackend(employeeData);
        const response = await client.post('/employees', mappedData);
        return response.data;
    },
    updateEmployee: async (id, employeeData) => {
        const mappedData = mapToBackend(employeeData);
        const response = await client.put(`/employees/${id}`, mappedData);
        return response.data;
    },
    deleteEmployee: async (id) => {
        const response = await client.delete(`/employees/${id}`);
        return response.data;
    }
};
