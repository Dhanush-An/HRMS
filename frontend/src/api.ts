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

const encodePathParams = (path: string): string => {
    if (path.startsWith('/api/employees/')) {
        const rest = path.slice('/api/employees/'.length);
        const parts = rest.split('/');
        const knownSubPaths = ['status', 'salary', 'location', 'avatar'];
        const lastPart = parts[parts.length - 1];
        if (knownSubPaths.includes(lastPart)) {
            const id = parts.slice(0, -1).join('/');
            return `/api/employees/${encodeURIComponent(id)}/${lastPart}`;
        } else {
            return `/api/employees/${encodeURIComponent(rest)}`;
        }
    }
    return path;
};

/** Wrapper around fetch that automatically attaches the JWT Bearer token and provides simple caching */
const api = {
    get: (path: string) => {
        const now = Date.now();
        const encodedPath = encodePathParams(path);
        if (apiCache.has(encodedPath)) {
            const cached = apiCache.get(encodedPath)!;
            if (now - cached.timestamp < CACHE_DURATION) {
                return cached.promise.then(res => res.clone());
            }
        }
        
        const promise = fetch(`${API_URL}${encodedPath}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        }).then(handleResponse);

        apiCache.set(encodedPath, { promise, timestamp: now });
        return promise.then(res => res.clone());
    },

    post: (path: string, body?: unknown) => {
        apiCache.clear();
        const encodedPath = encodePathParams(path);
        return fetch(`${API_URL}${encodedPath}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse);
    },

    postForm: (path: string, body: FormData) => {
        apiCache.clear();
        const encodedPath = encodePathParams(path);
        const headers = getAuthHeaders() as any;
        delete headers['Content-Type']; // Let browser set Content-Type with boundary
        return fetch(`${API_URL}${encodedPath}`, {
            method: 'POST',
            headers,
            body,
        }).then(handleResponse);
    },

    put: (path: string, body?: unknown) => {
        apiCache.clear();
        const encodedPath = encodePathParams(path);
        return fetch(`${API_URL}${encodedPath}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse);
    },

    delete: (path: string) => {
        apiCache.clear();
        const encodedPath = encodePathParams(path);
        return fetch(`${API_URL}${encodedPath}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse);
    },
};

export default api;
