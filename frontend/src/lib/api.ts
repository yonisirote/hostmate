import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Important for cookies
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

type AuthFailureListener = () => void;

const authFailureListeners = new Set<AuthFailureListener>();

export function onAuthFailure(listener: AuthFailureListener) {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

function notifyAuthFailure() {
  for (const listener of authFailureListeners) {
    listener();
  }
}

// Request interceptor to add bearer token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor for handling 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestedUrl: string | undefined = originalRequest?.url;
    const isPublicTokenEndpoint = requestedUrl?.startsWith('/guests/token/');

    // If error is 401 and we haven't tried to refresh yet
    // Note: public token endpoints should not force-refresh or redirect.
    if (error.response?.status === 401 && !originalRequest?._retry && !isPublicTokenEndpoint) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const { data } = await api.post('/auth/refresh', undefined, { timeout: 8000 });
        const newAccessToken = data.accessToken;

        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        notifyAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
