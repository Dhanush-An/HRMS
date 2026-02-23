import { API_URL } from './config';

const getToken = (): string | null => localStorage.getItem('token');

const getAuthHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

/** Handle 401/403 by clearing session and redirecting to login */
const handleResponse = (response: Response): Response => {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return response;
};

/** Wrapper around fetch that automatically attaches the JWT Bearer token */
const api = {
    get: (path: string) =>
        fetch(`${API_URL}${path}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        }).then(handleResponse),

    post: (path: string, body?: unknown) =>
        fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse),

    put: (path: string, body?: unknown) =>
        fetch(`${API_URL}${path}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse),

    delete: (path: string) =>
        fetch(`${API_URL}${path}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse),
};

export default api;
