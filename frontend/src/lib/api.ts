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

// Separate client for refresh to avoid interceptor loops.
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
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

// Dev-only guardrail: if refresh starts looping, warn loudly.
let refreshAttemptWindowStartMs = 0;
let refreshAttemptCountInWindow = 0;

function trackRefreshAttempt() {
  if (import.meta.env.DEV) {
    const now = Date.now();
    if (now - refreshAttemptWindowStartMs > 10_000) {
      refreshAttemptWindowStartMs = now;
      refreshAttemptCountInWindow = 0;
    }

    refreshAttemptCountInWindow += 1;
    if (refreshAttemptCountInWindow > 2) {
      console.warn('[auth] repeated refresh attempts detected', {
        refreshAttemptCountInWindow,
      });
    }
  }
}

// Response interceptor for handling 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestedUrl: string | undefined = originalRequest?.url;
    const isPublicTokenEndpoint = requestedUrl?.startsWith('/guests/token/');
    const isRefreshEndpoint = requestedUrl?.startsWith('/auth/refresh');

    // If error is 401 and we haven't tried to refresh yet
    // Note: public token endpoints should not force-refresh or redirect.
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isPublicTokenEndpoint &&
      !isRefreshEndpoint
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token. Use a separate client to avoid interceptor recursion.
        trackRefreshAttempt();
        const { data } = await refreshClient.post('/auth/refresh', undefined, { timeout: 8000 });
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

    // If refresh itself fails with 401, broadcast auth failure.
    if (error.response?.status === 401 && isRefreshEndpoint) {
      setAccessToken(null);
      notifyAuthFailure();
    }

    return Promise.reject(error);
  }
);
