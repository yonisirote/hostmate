import type { Guest, Meal, Menu, MenuCounts } from '../types';

import { api } from '../lib/api';

export async function listMeals() {
  const { data } = await api.get<Meal[]>('/meals');
  return data;
}

export async function createMeal(payload: { name: string; date: string; description?: string | null }) {
  const { data } = await api.post<Meal>('/meals', payload);
  return data;
}

export async function updateMeal(mealId: string, payload: { name: string; date: string; description?: string | null }) {
  await api.put(`/meals/${mealId}`, payload);
}

export async function deleteMeal(mealId: string) {
  await api.delete(`/meals/${mealId}`);
}

export async function getMealGuests(mealId: string) {
  const { data } = await api.get<Guest[]>(`/meals/${mealId}`);
  return data;
}

export async function getMealMenu(
  mealId: string,
  includeUnsafe: boolean,
  counts?: Partial<MenuCounts>
) {
  const { data } = await api.get<Menu>(`/meals/${mealId}/menu`, {
    params: {
      includeUnsafe: includeUnsafe ? 'true' : 'false',
      mainCount: counts?.main,
      sideCount: counts?.side,
      dessertCount: counts?.dessert,
      otherCount: counts?.other,
    },
  });
  return data;
}

export async function addMealGuests(mealId: string, guestIds: string[]) {
  await api.post(`/meals/${mealId}`, { guestIds });
}

export async function removeMealGuest(mealId: string, guestId: string) {
  await api.delete(`/meals/${mealId}/guests/${guestId}`);
}
