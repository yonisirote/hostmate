import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/useAuth';
import { getErrorMessage } from '../utils/errorHandler';
import {
  addGuestsToMeal,
  deleteMeal,
  fetchGuests,
  fetchMealGuests,
  fetchMeals,
  fetchSuggestedMenu,
  removeGuestFromMeal,
  updateMeal,
} from '../features/meals/api/mealsApi';
import { CreateMealButton } from '../features/meals/components/CreateMealButton';
import { GuestDishesModal } from '../features/meals/components/GuestDishesModal';
import { MealList } from '../features/meals/components/MealList';
import { ListShell } from '../features/meals/components/ListShell';
import type { GuestOption, Meal, MealGuest, SuggestedMenuByCategory } from '../features/meals/types';

type ModalGuest = { id: string; name: string; mealId: string };

const MealsPage = () => {
  const { accessToken, isInitializing } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealGuests, setMealGuests] = useState<Record<string, MealGuest[]>>({});
  const [menuByMeal, setMenuByMeal] = useState<Record<string, SuggestedMenuByCategory>>({});
  const [menuLoading, setMenuLoading] = useState<Record<string, boolean>>({});
  const [menuError, setMenuError] = useState<Record<string, string | null>>({});
  const [availableGuests, setAvailableGuests] = useState<GuestOption[]>([]);
  const [guestOptionsLoading, setGuestOptionsLoading] = useState(false);
  const [guestOptionsError, setGuestOptionsError] = useState<string | null>(null);
  const [modalGuest, setModalGuest] = useState<ModalGuest | null>(null);

  const loadAvailableGuests = useCallback(async () => {
    setGuestOptionsLoading(true);
    try {
      const data = await fetchGuests();
      setAvailableGuests(data);
      setGuestOptionsError(null);
    } catch (err) {
      console.error(err);
      setGuestOptionsError('Failed to load guests.');
    } finally {
      setGuestOptionsLoading(false);
    }
  }, []);

  const refreshMeals = useCallback(async () => {
    setLoading(true);
    try {
      const mealList = await fetchMeals();
      const guestsMap: Record<string, MealGuest[]> = {};
      await Promise.all(
        mealList.map(async (meal) => {
          try {
            guestsMap[meal.id] = await fetchMealGuests(meal.id);
          } catch (guestErr) {
            console.error(guestErr);
            guestsMap[meal.id] = [];
          }
        }),
      );
      setMeals(mealList);
      setMealGuests(guestsMap);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load meals.');
      setMealGuests({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken || isInitializing) {
      return;
    }
    void refreshMeals();
  }, [accessToken, isInitializing, refreshMeals]);

  useEffect(() => {
    if (!accessToken || isInitializing) {
      return;
    }
    void loadAvailableGuests();
  }, [accessToken, isInitializing, loadAvailableGuests]);

  useEffect(() => {
    if (!isInitializing && !accessToken) {
      setMeals([]);
      setMealGuests({});
      setAvailableGuests([]);
      setGuestOptionsError(null);
    }
  }, [accessToken, isInitializing]);

  const loadMealGuests = useCallback(
    async (mealId: string, { silent = false }: { silent?: boolean } = {}) => {
      try {
        const guests = await fetchMealGuests(mealId);
        setMealGuests((prev) => ({ ...prev, [mealId]: guests }));
        return guests;
      } catch (err) {
        console.error(err);
        if (!silent) {
          toast.error('Failed to load meal guests.');
        }
        throw err;
      }
    },
    [],
  );

  const loadSuggestedMenu = useCallback(async (mealId: string) => {
    setMenuLoading((state) => ({ ...state, [mealId]: true }));
    try {
      const normalized = await fetchSuggestedMenu(mealId);
      setMenuByMeal((prev) => ({ ...prev, [mealId]: normalized }));
      setMenuError((state) => ({ ...state, [mealId]: null }));
      return normalized;
    } catch (err) {
      console.error(err);
      setMenuError((state) => ({ ...state, [mealId]: 'Failed to load suggested menu.' }));
      throw err;
    } finally {
      setMenuLoading((state) => ({ ...state, [mealId]: false }));
    }
  }, []);

  const handleAddGuestsToMeal = useCallback(
    async (mealId: string, guestIds: string[]) => {
      const uniqueGuestIds = Array.from(new Set(guestIds.filter(Boolean)));
      if (uniqueGuestIds.length === 0) {
        return;
      }

      try {
        await addGuestsToMeal(mealId, uniqueGuestIds);
        await loadMealGuests(mealId, { silent: true });
        toast.success(uniqueGuestIds.length === 1 ? 'Guest added to meal' : 'Guests added to meal');
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Failed to add guests to meal.');
        toast.error(message);
        throw new Error(message);
      }
    },
    [loadMealGuests],
  );

  const handleRemoveGuestFromMeal = useCallback(
    async (mealId: string, guestId: string) => {
      try {
        await removeGuestFromMeal(mealId, guestId);
        toast.success('Guest removed from meal');
        await loadMealGuests(mealId, { silent: true });
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Failed to remove guest from meal.');
        toast.error(message);
        throw new Error(message);
      }
    },
    [loadMealGuests],
  );

  const headline = useMemo(() => {
    if (meals.length === 0) return 'Start by crafting a menu for your next gathering.';
    if (meals.length <= 3) return 'A handful of thoughtful menus ready to impress.';
    return `${meals.length} curated meals ready for your guests.`;
  }, [meals.length]);

  const handleDeleteMeal = useCallback(
    async (mealId: string) => {
      try {
        await deleteMeal(mealId);
        toast.success('Meal deleted');
        await refreshMeals();
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Failed to delete meal.');
        toast.error(message);
        throw new Error(message);
      }
    },
    [refreshMeals],
  );

  const handleUpdateMeal = useCallback(
    async (mealId: string, payload: { name: string; date: string; description?: string }) => {
      try {
        await updateMeal(mealId, payload);
        toast.success('Meal updated');
        await refreshMeals();
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Failed to update meal.');
        toast.error(message);
        throw new Error(message);
      }
    },
    [refreshMeals],
  );

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf4e3] text-[#6f5440]">
        Preparing your meals...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fdf4e3] text-[#3f2a1d]">
      <div className="pointer-events-none absolute -top-32 right-[-120px] h-96 w-96 rounded-full bg-[#f9c784] opacity-35 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-[-180px] left-[-100px] h-96 w-96 rounded-full bg-[#d88c9a] opacity-30 blur-3xl"></div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6 sm:py-20 lg:px-12 lg:py-24">
        <header className="mb-12 max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[#a77044] sm:text-xs sm:tracking-[0.35em]">Meal plans</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#2b1c12] sm:text-4xl">Design gatherings that feel effortless.</h1>
          <p className="mt-3 text-sm text-[#6f5440] sm:text-base">Pair the perfect guests with the dishes they adore. Add meals, jot down the essentials, and see exactly who is joining each table.</p>
        </header>

        <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-glow backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#2b1c12]">Upcoming meals</h2>
              <p className="text-sm text-[#6f5440]">{headline}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CreateMealButton onCreated={refreshMeals} />
            </div>
          </div>

          {loading && <ListShell>Loading meals...</ListShell>}
          {error && <ListShell error>{error}</ListShell>}
          {!loading && !error && (
            <MealList
              meals={meals}
              mealGuests={mealGuests}
              availableGuests={availableGuests}
              guestOptionsLoading={guestOptionsLoading}
              guestOptionsError={guestOptionsError}
              onAddGuests={handleAddGuestsToMeal}
              onLoadMenu={loadSuggestedMenu}
              menuByMeal={menuByMeal}
              menuLoading={menuLoading}
              menuError={menuError}
              onOpenGuestModal={(guest) => setModalGuest(guest)}
              onDeleteMeal={handleDeleteMeal}
              onUpdateMeal={handleUpdateMeal}
            />
          )}
          {modalGuest && (
            <GuestDishesModal
              guestId={modalGuest.id}
              guestName={modalGuest.name}
              mealId={modalGuest.mealId}
              onRemoveGuest={handleRemoveGuestFromMeal}
              onClose={() => setModalGuest(null)}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default MealsPage;