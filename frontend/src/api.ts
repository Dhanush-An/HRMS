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
        // Use a slight delay or just redirect
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detailedError = errorData.error ? `: ${errorData.error}` : '';
        throw new Error((errorData.message || `API Error: ${response.status}`) + detailedError);
    }

    return response;
};

/** Wrapper around fetch that automatically attaches the JWT Bearer token */
const api = {
    get: (path: string) =>
        fetch(`${API_URL}${path}${path.includes('?') ? '&' : '?'}_cb=${Date.now()}`, {
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
