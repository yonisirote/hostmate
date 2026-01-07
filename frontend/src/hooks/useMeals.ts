import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Guest, Meal } from '../types';

import {
  addMealGuests,
  createMeal,
  deleteMeal,
  getMealGuests,
  getMealMenu,
  listMeals,
  removeMealGuest,
  updateMeal,
} from '../api/meals';
import { queryKeys } from '../api/query-keys';

export function useMeals() {
  return useQuery({
    queryKey: queryKeys.meals.all(),
    queryFn: listMeals,
  });
}

export function useMealGuests(mealId: string | null) {
  return useQuery({
    queryKey: mealId ? queryKeys.meals.guests(mealId) : (['mealGuests', 'none'] as const),
    enabled: Boolean(mealId),
    queryFn: () => getMealGuests(mealId!),
  });
}

export function useMealMenu(mealId: string | null, includeUnsafe: boolean) {
  return useQuery({
    queryKey: mealId ? queryKeys.meals.menu(mealId, includeUnsafe) : (['mealMenu', 'none', includeUnsafe] as const),
    enabled: Boolean(mealId),
    queryFn: () => getMealMenu(mealId!, includeUnsafe),
  });
}

export function useMealMutations() {
  const queryClient = useQueryClient();

  const addMeal = useMutation({
    mutationFn: (data: { name: string; date: string; description?: string | null }) => createMeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all() });
    },
  });

  const updateMealById = useMutation({
    mutationFn: (payload: { id: string; data: { name: string; date: string; description?: string | null } }) =>
      updateMeal(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all() });
    },
  });

  const deleteMealById = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all() });
    },
  });

  const updateMealGuests = useMutation({
    mutationFn: async (payload: { mealId: string; guestIds: string[]; currentGuestIds: string[] }) => {
      const toAdd = payload.guestIds.filter((id) => !payload.currentGuestIds.includes(id));
      const toRemove = payload.currentGuestIds.filter((id) => !payload.guestIds.includes(id));

      if (toAdd.length > 0) {
        await addMealGuests(payload.mealId, toAdd);
      }

      await Promise.all(toRemove.map((guestId) => removeMealGuest(payload.mealId, guestId)));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.guests(variables.mealId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.menu(variables.mealId, false) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.menu(variables.mealId, true) });
    },
  });

  return { addMeal, updateMealById, deleteMealById, updateMealGuests };
}
