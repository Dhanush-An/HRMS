import { API_URL } from './config';

const getToken = (): string | null => {
    const token = localStorage.getItem('token');
    // Ensure we don't return "null" or "undefined" as strings
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
};

const getAuthHeaders = (): HeadersInit => {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // In dev/debug, log if token is present (not the token itself for security)
    if (import.meta.env.DEV) {
        console.debug(`[API] Auth headers prepared. Token present: ${!!token}`);
    }

    return headers;
};

/** Handle 401/403 by clearing session and redirecting to login */
const handleResponse = async (response: Response): Promise<Response> => {
    if (response.status === 401 || response.status === 403) {
        console.error(`[API ERROR] Unauthorized access (${response.status}) at ${response.url}. Clearing token.`);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use a slight delay or just redirect
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detailedError = errorData.error ? `: ${errorData.error}` : '';
        console.warn(`[API WARN] Status ${response.status} at ${response.url}`, errorData);
        throw new Error((errorData.message || `API Error: ${response.status}`) + detailedError);
    }

    return response;
};

const apiCache = new Map<string, { promise: Promise<Response>, timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

/** Wrapper around fetch that automatically attaches the JWT Bearer token and provides simple caching */
const api = {
    get: (path: string) => {
        const now = Date.now();
        if (apiCache.has(path)) {
            const cached = apiCache.get(path)!;
            if (now - cached.timestamp < CACHE_DURATION) {
                return cached.promise.then(res => res.clone());
            }
        }
        
        const promise = fetch(`${API_URL}${path}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        }).then(handleResponse);

        apiCache.set(path, { promise, timestamp: now });
        return promise.then(res => res.clone());
    },

    post: (path: string, body?: unknown) => {
        apiCache.clear();
        return fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse);
    },

    postForm: (path: string, body: FormData) => {
        apiCache.clear();
        const headers = getAuthHeaders() as any;
        delete headers['Content-Type']; // Let browser set Content-Type with boundary
        return fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers,
            body,
        }).then(handleResponse);
    },

    put: (path: string, body?: unknown) => {
        apiCache.clear();
        return fetch(`${API_URL}${path}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse);
    },

    delete: (path: string) => {
        apiCache.clear();
        return fetch(`${API_URL}${path}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse);
    },
};

export default api;
