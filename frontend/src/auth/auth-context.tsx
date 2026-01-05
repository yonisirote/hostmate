import * as React from "react";

import { apiFetch, HttpError } from "../lib/api";
import type { AuthContextValue, AuthState, LoginInput, SignupInput } from "./auth-context-value";
import { AuthContext } from "./auth-context-value";

type LoginResponse = {
  userID: string;
  username: string;
  name: string;
  accessToken: string;
};

type RefreshResponse = {
  accessToken: string;
};

const normalizeAuthError = (error: unknown): string => {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: false,
    error: null,
  });

  const refresh = React.useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const payload = await apiFetch<RefreshResponse>("/auth/refresh", { method: "POST" });
      setState((prev) => ({ ...prev, accessToken: payload.accessToken, isLoading: false }));
      return true;
    } catch {
      setState((prev) => ({ ...prev, accessToken: null, isLoading: false, error: null }));
      return false;
    }
  }, []);

  const login = React.useCallback(async (input: LoginInput) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const payload = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: input,
      });

      setState({
        user: { userId: payload.userID, username: payload.username, name: payload.name },
        accessToken: payload.accessToken,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: normalizeAuthError(error),
      }));
      return false;
    }
  }, []);

  const signup = React.useCallback(async (input: SignupInput) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: input,
      });

      // Immediately log in after signup.
      const loginPayload = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: { username: input.username, password: input.password },
      });

      setState({
        user: { userId: loginPayload.userID, username: loginPayload.username, name: loginPayload.name },
        accessToken: loginPayload.accessToken,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: normalizeAuthError(error),
      }));

      return false;
    }
  }, []);

  const logout = React.useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiFetch("/auth/revoke", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setState({ user: null, accessToken: null, isLoading: false, error: null });
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ state, login, signup, logout, refresh }),
    [state, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

