import type { AxiosResponse } from "axios";

import api from "../../../lib/axios";
import type { Allergy } from "../constants";

export async function fetchAllergiesList(): Promise<Allergy[]> {
  const response: AxiosResponse<Allergy[] | undefined> = await api.get("/allergies");
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchGuestAllergies(guestId: string): Promise<Allergy[]> {
  const response: AxiosResponse<Allergy[] | undefined> = await api.get(`/allergies/guests/${encodeURIComponent(guestId)}`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function setGuestAllergies(guestId: string, allergies: Allergy[]): Promise<Allergy[]> {
  const response: AxiosResponse<Allergy[] | undefined> = await api.put(`/allergies/guests/${encodeURIComponent(guestId)}`, { allergies });
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchDishAllergens(dishId: string): Promise<Allergy[]> {
  const response: AxiosResponse<Allergy[] | undefined> = await api.get(`/allergies/dishes/${encodeURIComponent(dishId)}`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function setDishAllergens(dishId: string, allergies: Allergy[]): Promise<Allergy[]> {
  const response: AxiosResponse<Allergy[] | undefined> = await api.put(`/allergies/dishes/${encodeURIComponent(dishId)}`, { allergies });
  return Array.isArray(response.data) ? response.data : [];
}
