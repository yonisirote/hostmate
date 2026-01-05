import * as React from "react";

import { useAuth } from "../auth/use-auth";
import { apiFetch, HttpError } from "./api";

export function useAuthedApi() {
  const {
    state: { accessToken },
    refresh,
    logout,
  } = useAuth();

  return React.useCallback(
    async <T,>(
      path: string,
      options?: {
        method?: string;
        body?: unknown;
      },
    ): Promise<T> => {
      try {
        return await apiFetch<T>(path, { ...options, accessToken });
      } catch (error) {
        if (error instanceof HttpError && error.status === 401) {
          const refreshed = await refresh();
          if (!refreshed) {
            await logout();
            throw error;
          }
          return await apiFetch<T>(path, { ...options, accessToken });
        }

        throw error;
      }
    },
    [accessToken, refresh, logout],
  );
}
