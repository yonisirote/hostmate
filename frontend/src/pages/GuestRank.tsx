import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import { Star } from 'lucide-react';

import { useGuestRankByToken, useRankDish } from '../hooks/useGuestRank';

export function GuestRank() {
  const { rankToken } = useParams<{ rankToken: string }>();

  const { data, isLoading, error } = useGuestRankByToken(rankToken ?? '');
  const rankMutation = useRankDish(rankToken);

  const saveRank = async (dishId: string, rank: number) => {
    if (!rankToken) return;

    rankMutation.mutate(
      { dishId, rank },
      {
        onSuccess: () => {
          toast.success('Saved');
        },
        onError: () => {
          toast.error('Failed to save ranking');
        },
      }
    );
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-warm-50 text-warm-600">Loading...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-warm-50 p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
        <p className="text-gray-600">This invitation link appears to be invalid or expired.</p>
      </div>
    );
  }

  const { guest, dishes, hostName } = data;

  // Group dishes by category
  const categories = {
    main: dishes.filter(d => d.category === 'main'),
    side: dishes.filter(d => d.category === 'side'),
    dessert: dishes.filter(d => d.category === 'dessert'),
    other: dishes.filter(d => d.category === 'other'),
  };

  return (
    <div className="min-h-screen bg-warm-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-warm-900">Hi, {guest.name}!</h1>
          <p className="mt-2 text-lg text-gray-600">
            {hostName ? `${hostName} needs` : "We need"} your help planning the perfect meal.
          </p>
          <p className="text-sm text-gray-500 mt-1">Rate the dishes below so we can create a menu everyone enjoys.</p>
        </div>

        <div className="space-y-8">
          {(['main', 'side', 'dessert', 'other'] as const).map(category => {
            const categoryDishes = categories[category];
            if (categoryDishes.length === 0) return null;

            return (
              <div key={category} className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="bg-warm-100 px-4 py-3 border-b border-warm-200">
                  <h3 className="text-lg leading-6 font-medium text-warm-900 capitalize">{category}s</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {categoryDishes.map(dish => (
                    <li key={dish.id} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 sm:mb-0">
                          <h4 className="text-lg font-bold text-gray-900">{dish.name}</h4>
                          {dish.description && <p className="text-sm text-gray-500 mt-1">{dish.description}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3].map((star) => (
                            <button
                              key={star}
                              type="button"
                              disabled={rankMutation.isPending}
                              onClick={async () => {
                                await saveRank(dish.id, star);
                              }}
                              className={clsx(
                                'p-2 rounded-full focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                                dish.rank !== null && dish.rank >= star
                                  ? 'text-yellow-400 hover:text-yellow-500'
                                  : 'text-gray-300 hover:text-gray-400'
                              )}
                              aria-label={`Rate ${dish.name} ${star} star${star > 1 ? 's' : ''}`}
                            >
                              <Star
                                className={clsx(
                                  'h-8 w-8',
                                  dish.rank !== null && dish.rank >= star && 'fill-current'
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
