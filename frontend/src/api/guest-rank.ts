import type { Dish, Guest } from '../types';

import { api } from '../lib/api';

export type GuestRankPayload = {
  guest: Guest;
  dishes: Array<Dish & { rank: number | null }>;
  hostName: string;
};

export async function getGuestRankByToken(rankToken: string) {
  const { data } = await api.get<GuestRankPayload>(`/guests/token/${rankToken}`);
  return data;
}

export async function rankDishByToken(rankToken: string, dishId: string, rank: number) {
  await api.post(`/guests/token/${rankToken}/dishes/${dishId}`, { rank });
}
