import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Helper to get or create session ID
const getOrCreateSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;

  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Request interceptor to add session ID
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Note: Auth tokens are now sent automatically via httpOnly cookies
      // No need to manually add Authorization header

      // Always add session ID for cart operations (allows merging guest cart after login)
      const sessionId = getOrCreateSessionId();
      if (sessionId) {
        config.headers['X-Session-ID'] = sessionId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't try to refresh if we're on auth pages or if the request was for auth endpoints
      const isAuthEndpoint = originalRequest.url?.includes('/auth/');
      const isOnAuthPage = typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/auth/') || window.location.pathname === '/auth');

      if (isAuthEndpoint || isOnAuthPage) {
        // Don't try to refresh or redirect - just reject the error
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token using the httpOnly refresh token cookie
        // The backend will read the refresh token from the cookie and set a new access token cookie
        await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true, // Send cookies with the request
          }
        );

        // Retry the original request (the new access token cookie will be sent automatically)
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, redirect to login (only if not already on auth page)
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
