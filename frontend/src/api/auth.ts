import type { User } from '../types';

import { api } from '../lib/api';

export type LoginResponse = {
  userID: string;
  name: string;
  username: string;
  accessToken: string;
};

export async function login(payload: { username: string; password: string }) {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function signup(payload: { name: string; username: string; password: string }) {
  await api.post('/auth/signup', payload);
}

export async function refresh() {
  const { data } = await api.post<{ accessToken: string }>('/auth/refresh', undefined, { timeout: 8000 });
  return data;
}

export async function revoke() {
  await api.post('/auth/revoke');
}

export function toUser(dto: LoginResponse): User {
  return { id: dto.userID, name: dto.name, username: dto.username };
}
