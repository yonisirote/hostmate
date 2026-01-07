import type { Dish } from '../types';

import { api } from '../lib/api';

export async function listDishes() {
  const { data } = await api.get<Dish[]>('/dishes');
  return data;
}

export async function createDish(payload: { name: string; category: Dish['category']; description?: string | null }) {
  const { data } = await api.post<Dish>('/dishes', payload);
  return data;
}

export async function updateDish(dishId: string, payload: { name: string; category: Dish['category']; description?: string | null }) {
  await api.put(`/dishes/${dishId}`, payload);
}

export async function deleteDish(dishId: string) {
  await api.delete(`/dishes/${dishId}`);
}
