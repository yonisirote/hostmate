import { http, HttpResponse } from 'msw';

import type { Allergy, Dish, Guest, Meal } from '../../src/types';

type Db = {
  me: { id: string; name: string; username: string };
  accessToken: string;
  guests: Guest[];
  guestAllergies: Record<string, Allergy[]>;
  dishes: Dish[];
  dishAllergens: Record<string, Allergy[]>;
  meals: Meal[];
  mealGuests: Record<string, Guest[]>;
  guestRanks: Record<string, Record<string, number>>; // guestId -> dishId -> rank
  guestByToken: Record<string, Guest>;
  hostName: string;
};

export function createDb(): Db {
  const hostUser = { id: 'u_1', name: 'Host', username: 'host' };

  const guests: Guest[] = [
    { id: 'g_1', name: 'Alice', userId: hostUser.id, rankToken: 'token_alice' },
    { id: 'g_2', name: 'Bob', userId: hostUser.id, rankToken: 'token_bob' },
  ];

  const dishes: Dish[] = [
    { id: 'd_1', name: 'Roast Chicken', description: 'Golden and juicy', category: 'main', userId: hostUser.id },
    { id: 'd_2', name: 'Garden Salad', description: null, category: 'side', userId: hostUser.id },
    { id: 'd_3', name: 'Chocolate Cake', description: null, category: 'dessert', userId: hostUser.id },
  ];

  return {
    me: hostUser,
    accessToken: 'access_1',
    guests,
    guestAllergies: {
      g_1: ['dairy'],
      g_2: [],
    },
    dishes,
    dishAllergens: {
      d_1: [],
      d_2: [],
      d_3: ['eggs'],
    },
    meals: [
      {
        id: 'm_1',
        name: 'Friday Dinner',
        description: 'Casual night',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: hostUser.id,
      },
    ],
    mealGuests: {
      m_1: [guests[0]!, guests[1]!],
    },
    guestRanks: {
      g_1: { d_1: 2, d_2: 3, d_3: 1 },
      g_2: {},
    },
    guestByToken: {
      token_alice: guests[0]!,
      token_bob: guests[1]!,
    },
    hostName: 'Host',
  };
}

function json(body: unknown, init?: { status?: number }) {
  return HttpResponse.json(body, { status: init?.status ?? 200 });
}

function requireAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function createHandlers(db: Db) {
  return [
    // Auth
    http.post('/api/auth/login', async () => {
      return json({
        userID: db.me.id,
        name: db.me.name,
        username: db.me.username,
        accessToken: db.accessToken,
      });
    }),

    http.post('/api/auth/signup', async () => {
      return json({ ok: true });
    }),

    http.post('/api/auth/refresh', async () => {
      return json({ accessToken: db.accessToken });
    }),

    http.post('/api/auth/revoke', async () => {
      return json({ ok: true });
    }),

    // Guests
    http.get('/api/guests', ({ request }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      return json(db.guests);
    }),

    http.post('/api/guests', async ({ request }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;

      const body = (await request.json()) as { name?: string };
      const newGuest: Guest = {
        id: `g_${db.guests.length + 1}`,
        name: body.name ?? 'New Guest',
        userId: db.me.id,
        rankToken: `token_${db.guests.length + 1}`,
      };
      db.guests.unshift(newGuest);
      db.guestAllergies[newGuest.id] = [];
      db.guestByToken[newGuest.rankToken] = newGuest;
      return json(newGuest);
    }),

    http.put('/api/guests/:guestId', async ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const guestId = params.guestId as string;

      const body = (await request.json()) as { name?: string };
      db.guests = db.guests.map((g) => (g.id === guestId ? { ...g, name: body.name ?? g.name } : g));
      return json({ ok: true });
    }),

    http.delete('/api/guests/:guestId', ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const guestId = params.guestId as string;

      db.guests = db.guests.filter((g) => g.id !== guestId);
      delete db.guestAllergies[guestId];
      return json({ ok: true });
    }),

    // Guest allergies
    http.get('/api/allergies/guests', ({ request }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;

      const url = new URL(request.url);
      const guestIds = url.searchParams.get('guestIds') ?? '';
      const ids = guestIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      const result: Record<string, Allergy[]> = {};
      for (const id of ids) {
        result[id] = db.guestAllergies[id] ?? [];
      }
      return json(result);
    }),

    http.get('/api/allergies/guests/:guestId', ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const guestId = params.guestId as string;
      return json(db.guestAllergies[guestId] ?? []);
    }),

    http.put('/api/allergies/guests/:guestId', async ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const guestId = params.guestId as string;
      const body = (await request.json()) as { allergies?: Allergy[] };
      db.guestAllergies[guestId] = body.allergies ?? [];
      return json(db.guestAllergies[guestId]);
    }),

    // Dishes
    http.get('/api/dishes', ({ request }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      return json(db.dishes);
    }),

    http.post('/api/dishes', async ({ request }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;

      const body = (await request.json()) as { name?: string; category?: Dish['category']; description?: string | null };
      const newDish: Dish = {
        id: `d_${db.dishes.length + 1}`,
        name: body.name ?? 'New Dish',
        description: body.description ?? null,
        category: body.category ?? 'other',
        userId: db.me.id,
      };
      db.dishes.unshift(newDish);
      db.dishAllergens[newDish.id] = [];
      return json(newDish);
    }),

    http.put('/api/dishes/:dishId', async ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const dishId = params.dishId as string;
      const body = (await request.json()) as { name?: string; category?: Dish['category']; description?: string | null };

      db.dishes = db.dishes.map((d) =>
        d.id === dishId
          ? { ...d, name: body.name ?? d.name, category: body.category ?? d.category, description: body.description ?? d.description }
          : d
      );
      return json({ ok: true });
    }),

    http.delete('/api/dishes/:dishId', ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const dishId = params.dishId as string;

      db.dishes = db.dishes.filter((d) => d.id !== dishId);
      delete db.dishAllergens[dishId];
      return json({ ok: true });
    }),

    // Dish allergens
    http.get('/api/allergies/dishes', ({ request }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;

      const url = new URL(request.url);
      const dishIds = url.searchParams.get('dishIds') ?? '';
      const ids = dishIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      const result: Record<string, Allergy[]> = {};
      for (const id of ids) {
        result[id] = db.dishAllergens[id] ?? [];
      }
      return json(result);
    }),

    http.get('/api/allergies/dishes/:dishId', ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const dishId = params.dishId as string;
      return json(db.dishAllergens[dishId] ?? []);
    }),

    http.put('/api/allergies/dishes/:dishId', async ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const dishId = params.dishId as string;
      const body = (await request.json()) as { allergies?: Allergy[] };
      db.dishAllergens[dishId] = body.allergies ?? [];
      return json(db.dishAllergens[dishId]);
    }),

    // Meals
    http.get('/api/meals', ({ request }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      return json(db.meals);
    }),

    http.post('/api/meals', async ({ request }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;

      const body = (await request.json()) as Partial<Meal>;
      const newMeal: Meal = {
        id: `m_${db.meals.length + 1}`,
        name: body.name ?? 'New Meal',
        description: body.description ?? null,
        date: body.date ?? new Date().toISOString(),
        userId: db.me.id,
      };
      db.meals.unshift(newMeal);
      db.mealGuests[newMeal.id] = [];
      return json(newMeal);
    }),

    http.put('/api/meals/:mealId', async ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const mealId = params.mealId as string;
      const body = (await request.json()) as Partial<Meal>;

      db.meals = db.meals.map((m) => (m.id === mealId ? { ...m, ...body } : m));
      return json({ ok: true });
    }),

    http.delete('/api/meals/:mealId', ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const mealId = params.mealId as string;

      db.meals = db.meals.filter((m) => m.id !== mealId);
      delete db.mealGuests[mealId];
      return json({ ok: true });
    }),

    http.get('/api/meals/:mealId', ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const mealId = params.mealId as string;
      return json(db.mealGuests[mealId] ?? []);
    }),

    http.post('/api/meals/:mealId', async ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const mealId = params.mealId as string;

      const body = (await request.json()) as { guestIds?: string[] };
      const toAddIds = body.guestIds ?? [];
      const current = db.mealGuests[mealId] ?? [];
      const added = db.guests.filter((g) => toAddIds.includes(g.id));
      db.mealGuests[mealId] = [...current, ...added];
      return json({ ok: true });
    }),

    http.delete('/api/meals/:mealId/guests/:guestId', ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;
      const mealId = params.mealId as string;
      const guestId = params.guestId as string;

      db.mealGuests[mealId] = (db.mealGuests[mealId] ?? []).filter((g) => g.id !== guestId);
      return json({ ok: true });
    }),

     http.get('/api/meals/:mealId/menu', ({ request }) => {
       const unauthorized = requireAuth(request);
       if (unauthorized) return unauthorized;

       const url = new URL(request.url);
       const mainCount = Number(url.searchParams.get('mainCount') ?? '1');
       const sideCount = Number(url.searchParams.get('sideCount') ?? '1');
       const dessertCount = Number(url.searchParams.get('dessertCount') ?? '1');
       const otherCount = Number(url.searchParams.get('otherCount') ?? '1');

       // Keep it simple: return top N of each category
       const byCategory = (category: Dish['category']) => db.dishes.filter((d) => d.category === category);

       return json({
         main: byCategory('main').slice(0, mainCount),
         side: byCategory('side').slice(0, sideCount),
         dessert: byCategory('dessert').slice(0, dessertCount),
         other: byCategory('other').slice(0, otherCount),
       });
     }),


    // Public ranking endpoints
    http.get('/api/guests/token/:rankToken', ({ params }) => {
      const rankToken = params.rankToken as string;
      const guest = db.guestByToken[rankToken];
      if (!guest) return json({ error: 'Invalid token' }, { status: 404 });

      const rankedForGuest = db.guestRanks[guest.id] ?? {};
      const dishes = db.dishes.map((dish) => ({ ...dish, rank: rankedForGuest[dish.id] ?? null }));

      return json({ guest, dishes, hostName: db.hostName });
    }),

    http.post('/api/guests/token/:rankToken/dishes/:dishId', async ({ request, params }) => {
      const rankToken = params.rankToken as string;
      const dishId = params.dishId as string;
      const guest = db.guestByToken[rankToken];
      if (!guest) return json({ error: 'Invalid token' }, { status: 404 });

      const body = (await request.json()) as { rank?: number };
      const rank = body.rank;
      if (!rank || rank < 1 || rank > 3) return json({ error: 'Invalid rank' }, { status: 400 });

      if (!db.guestRanks[guest.id]) db.guestRanks[guest.id] = {};
      db.guestRanks[guest.id]![dishId] = rank;

      return json({ ok: true });
    }),
  ];
}
