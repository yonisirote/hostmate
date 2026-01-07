import type { Guest } from '../types';

import { api } from '../lib/api';

export async function listGuests() {
  const { data } = await api.get<Guest[]>('/guests');
  return data;
}

export async function createGuest(payload: { name: string }) {
  const { data } = await api.post<Guest>('/guests', payload);
  return data;
}

export async function updateGuest(guestId: string, payload: { name: string }) {
  await api.put(`/guests/${guestId}`, payload);
}

export async function deleteGuest(guestId: string) {
  await api.delete(`/guests/${guestId}`);
}
