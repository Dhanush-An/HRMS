import client from '../client';

const mapToFrontend = (data) => ({
    ...data,
    employeeId: data.employee_id || data.employeeId,
    baseSalary: data.base_salary || data.baseSalary,
    netPay: data.net_pay || data.netPay,
    taxStatus: data.tax_status || data.taxStatus,
    pfStatus: data.pf_status || data.pfStatus,
    esiStatus: data.esi_status || data.esiStatus,
    paymentDate: data.payment_date || data.paymentDate,
    employeeName: data.employeeName || data.employee_name
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
