import * as React from "react";

export type AuthUser = {
  userId: string;
  username: string;
  name: string;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type SignupInput = {
  username: string;
  name: string;
  password: string;
};

export type AuthContextValue = {
  state: AuthState;
  login(input: LoginInput): Promise<boolean>;
  signup(input: SignupInput): Promise<boolean>;
  logout(): Promise<void>;
  refresh(): Promise<boolean>;
};

export const AuthContext = React.createContext<AuthContextValue | null>(null);
