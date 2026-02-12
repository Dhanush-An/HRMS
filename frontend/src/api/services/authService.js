import client from '../client';

export const authService = {
    login: async (email, password, role) => {
        const response = await client.post('/auth/login', { email: email.toLowerCase(), password, role: role.toLowerCase() });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    register: async (name, email, password, role) => {
        const response = await client.post('/auth/register', { name, email: email.toLowerCase(), password, role });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
    },
    getPendingRegistrations: async () => {
        const response = await client.get('/auth/pending');
        return response.data;
    },
    approveRegistration: async (id) => {
        const response = await client.post('/auth/approve', { id });
        return response.data;
    },
    rejectRegistration: async (id) => {
        const response = await client.post('/auth/reject', { id });
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await client.get('/auth/me');
        return response.data;
    }
};
