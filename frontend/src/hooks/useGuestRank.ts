import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { GuestRankPayload } from '../api/guest-rank';

import { getGuestRankByToken, rankDishByToken } from '../api/guest-rank';
import { queryKeys } from '../api/query-keys';

export function useGuestRankByToken(rankToken: string) {
  return useQuery({
    queryKey: queryKeys.guestRank.byToken(rankToken),
    enabled: Boolean(rankToken),
    queryFn: () => getGuestRankByToken(rankToken),
    retry: false,
  });
}

export function useRankDish(rankToken: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dishId, rank }: { dishId: string; rank: number }) => {
      if (!rankToken) return;
      await rankDishByToken(rankToken, dishId, rank);
    },
    onMutate: async ({ dishId, rank }) => {
      if (!rankToken) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.guestRank.byToken(rankToken) });
      const previous = queryClient.getQueryData<GuestRankPayload>(queryKeys.guestRank.byToken(rankToken));

      queryClient.setQueryData<GuestRankPayload>(queryKeys.guestRank.byToken(rankToken), (current) => {
        if (!current) return current;
        return {
          ...current,
          dishes: current.dishes.map((dish) => (dish.id === dishId ? { ...dish, rank } : dish)),
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (rankToken && context?.previous) {
        queryClient.setQueryData(queryKeys.guestRank.byToken(rankToken), context.previous);
      }
    },
    onSettled: async () => {
      if (!rankToken) return;
      await queryClient.invalidateQueries({ queryKey: queryKeys.guestRank.byToken(rankToken) });
    },
  });
}
