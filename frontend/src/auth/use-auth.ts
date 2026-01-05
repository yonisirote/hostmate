import * as React from "react";

import type { AuthContextValue } from "./auth-context-value";
import { AuthContext } from "./auth-context-value";

export function useAuth() {
  const ctx = React.useContext<AuthContextValue | null>(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
