import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Allergy, Dish } from '../types';

import { getDishAllergensMap, setDishAllergens } from '../api/allergies';
import { createDish, deleteDish, listDishes, updateDish } from '../api/dishes';
import { queryKeys } from '../api/query-keys';

export function useDishes() {
  return useQuery({
    queryKey: queryKeys.dishes.all(),
    queryFn: listDishes,
  });
}

export function useDishAllergensMap(dishIds: string[]) {
  const dishIdsCsv = dishIds.join(',');

  return useQuery({
    queryKey: queryKeys.dishes.allergensMap(dishIdsCsv),
    enabled: dishIds.length > 0,
    queryFn: () => getDishAllergensMap(dishIds),
  });
}

export function useDishMutations() {
  const queryClient = useQueryClient();

  const addDish = useMutation({
    mutationFn: (dish: { name: string; category: Dish['category']; description?: string | null }) => createDish(dish),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all() });
    },
  });

  const updateDishWithAllergies = useMutation({
    mutationFn: async (payload: { id: string; data: { name: string; category: Dish['category']; description?: string | null }; allergies: Allergy[] }) => {
      await updateDish(payload.id, payload.data);
      await setDishAllergens(payload.id, payload.allergies);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all() });
      queryClient.invalidateQueries({ queryKey: ['dishAllergensMap'] });
    },
  });

  const deleteDishById = useMutation({
    mutationFn: deleteDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all() });
    },
  });

  return { addDish, updateDishWithAllergies, deleteDishById };
}
