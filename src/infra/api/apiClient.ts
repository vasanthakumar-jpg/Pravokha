import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "";

if (!import.meta.env.VITE_API_URL) {
    console.warn('VITE_API_URL is not defined. Falling back to relative URLs. If your backend is running on a different origin, set VITE_API_URL to the backend URL (e.g. http://localhost:3000)');
}

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding the bearer token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('pravokha_auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling 401s or common errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Handle network/connection errors
            console.error('API Connection Error: The server might be down or unreachable.', error.message);
            // We could trigger a global toast here if we had access to the hook, 
            // but we'll let the calling component handle the specific UI feedback.
        } else if (error.response?.status === 401) {
            // Handle unauthorized - maybe clear local storage and redirect
            localStorage.removeItem('pravokha_auth_token');
            localStorage.removeItem('pravokha_user_role');
            localStorage.removeItem('pravokha_user_id');
            // Avoid window.location.href here to let the app handle it via state
        }
        return Promise.reject(error);
    }
);
