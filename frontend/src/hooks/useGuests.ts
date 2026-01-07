import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Allergy } from '../types';

import { getGuestAllergiesMap, setGuestAllergies } from '../api/allergies';
import { createGuest, deleteGuest, listGuests, updateGuest } from '../api/guests';
import { queryKeys } from '../api/query-keys';

export function useGuests() {
  return useQuery({
    queryKey: queryKeys.guests.all(),
    queryFn: listGuests,
  });
}

export function useGuestAllergiesMap(guestIds: string[]) {
  const guestIdsCsv = guestIds.join(',');

  return useQuery({
    queryKey: queryKeys.guests.allergiesMap(guestIdsCsv),
    enabled: guestIds.length > 0,
    queryFn: () => getGuestAllergiesMap(guestIds),
  });
}

export function useGuestMutations() {
  const queryClient = useQueryClient();

  const addGuest = useMutation({
    mutationFn: (name: string) => createGuest({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all() });
    },
  });

  const updateGuestWithAllergies = useMutation({
    mutationFn: async (payload: { id: string; name: string; allergies: Allergy[] }) => {
      await updateGuest(payload.id, { name: payload.name });
      await setGuestAllergies(payload.id, payload.allergies);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all() });
      queryClient.invalidateQueries({ queryKey: ['guestAllergiesMap'] });
    },
  });

  const deleteGuestById = useMutation({
    mutationFn: deleteGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all() });
    },
  });

  return { addGuest, updateGuestWithAllergies, deleteGuestById };
}
