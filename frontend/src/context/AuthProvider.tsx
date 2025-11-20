import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, type AuthContextValue, type AuthState } from "./AuthContext";
import { getAccessToken, setAccessToken as storeAccessToken, subscribe as subscribeToAccessToken } from "../lib/authTokenStore";
import { refreshAccessToken } from "../lib/axios";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ userId: null, accessToken: null });
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const previousAuthStateRef = useRef<AuthState>(authState);

  const setAuth = useCallback<AuthContextValue["setAuth"]>((state) => {
    setAuthState(state);
    storeAccessToken(state.accessToken);
  }, []);

  const clearAuth = useCallback<AuthContextValue["clearAuth"]>(() => {
    setAuthState({ userId: null, accessToken: null });
    storeAccessToken(null);
  }, []);

  // Initialize auth on mount: load from storage or refresh from server
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getAccessToken();

      if (storedToken) {
        setAuthState((prev) => ({ ...prev, accessToken: storedToken }));
        setIsInitializing(false);
        return;
      }

      // Try to refresh token from server (uses httpOnly cookie)
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          storeAccessToken(newToken);
          setAuthState((prev) => ({ ...prev, accessToken: newToken }));
        }
      } catch {
        storeAccessToken(null);
      } finally {
        setIsInitializing(false);
      }
    };

    void initializeAuth();
  }, []);

  // Subscribe to external token changes (e.g., from another tab)
  useEffect(() => {
    const applyToken = (token: string | null) => {
      setAuthState((prev) => {
        if (token === null) {
          if (prev.userId === null && prev.accessToken === null) {
            return prev;
          }
          return { userId: null, accessToken: null };
        }
        if (prev.accessToken === token) {
          return prev;
        }
        return { ...prev, accessToken: token };
      });
    };

    const unsubscribe = subscribeToAccessToken(applyToken);
    return unsubscribe;
  }, []);

  // Detect logout and redirect to login
  useEffect(() => {
    const wasAuthed = Boolean(previousAuthStateRef.current.accessToken);
    const isAuthed = Boolean(authState.accessToken);

    if (wasAuthed && !isAuthed) {
      navigate("/login", { replace: true });
    }

    previousAuthStateRef.current = authState;
  }, [authState.accessToken, navigate]);

  const value = useMemo<AuthContextValue>(() => ({
    userId: authState.userId,
    accessToken: authState.accessToken,
    setAuth,
    clearAuth,
    isInitializing,
  }), [authState.accessToken, authState.userId, clearAuth, isInitializing, setAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
