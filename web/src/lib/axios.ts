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

// Helper to get access token from localStorage (fallback for cross-origin)
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

// Helper to save tokens to localStorage
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Helper to clear tokens from localStorage
export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Request interceptor to add session ID and Authorization header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Add Authorization header from localStorage (fallback for cross-origin cookies)
      const accessToken = getAccessToken();
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }

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
        // Get refresh token from localStorage
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        if (!refreshToken) {
          clearTokens();
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        // Save new access token
        if (response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);

          // Update the original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
        }

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed - clear tokens
        clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
