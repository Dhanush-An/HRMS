import { API_URL } from './config';

const getToken = (): string | null => localStorage.getItem('token');

const getAuthHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

/** Wrapper around fetch that automatically attaches the JWT Bearer token */
const api = {
    get: (path: string) =>
        fetch(`${API_URL}${path}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        }),

    post: (path: string, body?: unknown) =>
        fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: (path: string, body?: unknown) =>
        fetch(`${API_URL}${path}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: (path: string) =>
        fetch(`${API_URL}${path}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }),
};

export default api;
