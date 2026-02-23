import { API_URL } from './config';

const getToken = (): string | null => localStorage.getItem('token');

const getAuthHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

/** Handle 401/403 by clearing session and redirecting to login */
const handleResponse = async (response: Response): Promise<Response> => {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        // Return a pending promise that never resolves to stop execution
        return new Promise(() => { });
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
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
