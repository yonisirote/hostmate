import type { Allergy } from '../types';

import { api } from '../lib/api';

export async function getAllergiesList() {
  const { data } = await api.get<Allergy[]>('/allergies');
  return data;
}

export async function getGuestAllergiesMap(guestIds: string[]) {
  const guestIdsCsv = guestIds.join(',');
  const { data } = await api.get<Record<string, Allergy[]>>('/allergies/guests', {
    params: { guestIds: guestIdsCsv },
  });
  return data;
}

export async function setGuestAllergies(guestId: string, allergies: Allergy[]) {
  const { data } = await api.put<Allergy[]>(`/allergies/guests/${guestId}`, { allergies });
  return data;
}

export async function getDishAllergensMap(dishIds: string[]) {
  const dishIdsCsv = dishIds.join(',');
  const { data } = await api.get<Record<string, Allergy[]>>('/allergies/dishes', {
    params: { dishIds: dishIdsCsv },
  });
  return data;
}

export async function setDishAllergens(dishId: string, allergies: Allergy[]) {
  const { data } = await api.put<Allergy[]>(`/allergies/dishes/${dishId}`, { allergies });
  return data;
}
