import client from '../client';

const mapToFrontend = (data) => ({
    ...data,
    employeeId: data.employee_id,
    baseSalary: data.base_salary,
    netPay: data.net_pay,
    taxStatus: data.tax_status,
    pfStatus: data.pf_status,
    esiStatus: data.esi_status,
    paymentDate: data.payment_date,
    employeeName: data.employeeName
});

export const payrollService = {
    getAllPayroll: async () => {
        const response = await client.get('/payroll');
        return response.data.map(mapToFrontend);
    },
    generatePayroll: async (month, year) => {
        const response = await client.post('/payroll/generate', { month, year });
        return response.data;
    },
    getEmployeePayroll: async (employeeId) => {
        const response = await client.get(`/payroll/employee/${employeeId}`);
        return response.data.map(mapToFrontend);
    },
    updatePayroll: async (id, data) => {
        const response = await client.put(`/payroll/${id}`, data);
        return mapToFrontend(response.data.record);
    }
};
