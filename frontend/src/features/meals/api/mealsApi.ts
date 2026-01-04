import type { AxiosResponse } from "axios";
import api from "../../../lib/axios";
import type {
  GuestDishRank,
  GuestOption,
  Meal,
  MealGuest,
  SuggestedMenuByCategory,
  SuggestedMenuItem,
  SuggestedMenuResponse,
} from "../types";
import { groupMenuItemsByCategory } from "../utils/menu";

export async function fetchMeals(): Promise<Meal[]> {
  const response: AxiosResponse<Meal[]> = await api.get("/meals");
  const data = Array.isArray(response.data) ? response.data : [];
  return [...data].sort((a, b) => {
    const aTime = new Date(a.date ?? "").getTime();
    const bTime = new Date(b.date ?? "").getTime();
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0);
    }
    return bTime - aTime;
  });
}

export async function fetchMealGuests(mealId: string): Promise<MealGuest[]> {
  const response: AxiosResponse<MealGuest[]> = await api.get(`/meals/${mealId}`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function addGuestsToMeal(mealId: string, guestIds: string[]) {
  const response = await api.post(`/meals/${mealId}`, { guestIds });
  return response.data;
}

export async function removeGuestFromMeal(mealId: string, guestId: string) {
  const response = await api.delete(`/meals/${mealId}/guests/${guestId}`);
  return response.data;
}

export async function fetchSuggestedMenu(mealId: string, options?: { includeUnsafe?: boolean }): Promise<SuggestedMenuByCategory> {
  const params = new URLSearchParams();
  if (options?.includeUnsafe) {
    params.set("includeUnsafe", "true");
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const response: AxiosResponse<SuggestedMenuResponse | SuggestedMenuItem[] | undefined> = await api.get(`/meals/${mealId}/menu${suffix}`);
  return groupMenuItemsByCategory(response.data);
}

export async function fetchGuestDishRanks(guestId: string): Promise<GuestDishRank[]> {
  const response: AxiosResponse<GuestDishRank[]> = await api.get(`/guests/${guestId}/dishes`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function createMeal(payload: { name: string; date: string; description?: string }) {
  const response = await api.post("/meals", payload);
  return response.data;
}

export async function deleteMeal(mealId: string): Promise<void> {
  await api.delete(`/meals/${mealId}`);
}

export async function updateMeal(
  mealId: string,
  payload: { name: string; date: string; description?: string },
): Promise<void> {
  await api.put(`/meals/${mealId}`, payload);
}

export async function saveGuestDishRank(guestId: string, dishId: string, rank: number | null) {
  const response = await api.post(`/guests/${encodeURIComponent(guestId)}/dishes/${encodeURIComponent(dishId)}`, { rank });
  return response.data;
}

export async function fetchGuests(): Promise<GuestOption[]> {
  const response: AxiosResponse<GuestOption[]> = await api.get("/guests");
  return Array.isArray(response.data) ? response.data : [];
}
