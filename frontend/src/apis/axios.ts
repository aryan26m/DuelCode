import axios from 'axios';

const runningOnLocalHost =
    typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.DEV || runningOnLocalHost
        ? 'http://localhost:3000'
        : 'https://duelcode.onrender.com');
const PUBLIC_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/register/verify-otp',
    '/api/auth/leaderboard'
];

const isPublicEndpoint = (url = '') => {
    return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

const api=axios.create({
    baseURL:BACKEND_URL,
    withCredentials:true
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const requestUrl = config.url || '';

    if (token && !isPublicEndpoint(requestUrl)) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const requestUrl = error?.config?.url || '';

        if (status === 401 && !isPublicEndpoint(requestUrl)) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');

            if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);

export default api;