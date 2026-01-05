import * as React from "react";

import { useAuthedApi } from "../lib/use-authed-api";
import type { Guest, Meal } from "../lib/types";

type MealGuestJoin = {
  mealId: string;
  guestId: string;
};

type MenuItem = {
  dishId: string;
  name: string;
  description: string | null;
  category: string;
  avgRank: string | number | null;
  conflictingAllergies: string[];
};

type MenuResponse = {
  main: MenuItem[];
  side: MenuItem[];
  dessert: MenuItem[];
  other: MenuItem[];
};

export function MealsPage() {
  const authedApi = useAuthedApi();

  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [meals, setMeals] = React.useState<Meal[]>([]);
  const [guests, setGuests] = React.useState<Guest[]>([]);

  const [selectedMealId, setSelectedMealId] = React.useState<string | null>(null);
  const selectedMeal = meals.find((meal) => meal.id === selectedMealId) ?? null;

  const [newMealName, setNewMealName] = React.useState("");
  const [newMealDate, setNewMealDate] = React.useState("");
  const [newMealDesc, setNewMealDesc] = React.useState("");

  const [editedName, setEditedName] = React.useState("");
  const [editedDate, setEditedDate] = React.useState("");
  const [editedDesc, setEditedDesc] = React.useState("");

  const [mealGuestIds, setMealGuestIds] = React.useState<string[]>([]);
  const [selectedGuestIdsToAdd, setSelectedGuestIdsToAdd] = React.useState<string[]>([]);

  const [includeUnsafe, setIncludeUnsafe] = React.useState(false);
  const [menu, setMenu] = React.useState<MenuResponse | null>(null);
  const [menuLoading, setMenuLoading] = React.useState(false);

  async function loadAll() {
    setIsLoading(true);
    setError(null);
    try {
      const [mealsList, guestsList] = await Promise.all([
        authedApi<Meal[]>("/meals"),
        authedApi<Guest[]>("/guests"),
      ]);
      setMeals(mealsList);
      setGuests(guestsList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load meals");
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!selectedMeal) {
      setEditedName("");
      setEditedDate("");
      setEditedDesc("");
      setMealGuestIds([]);
      setSelectedGuestIdsToAdd([]);
      setMenu(null);
      return;
    }

    setEditedName(selectedMeal.name);
    setEditedDate(selectedMeal.date);
    setEditedDesc(selectedMeal.description ?? "");

    let cancelled = false;
    (async () => {
      try {
        const mealGuests = await authedApi<Guest[]>(`/meals/${selectedMeal.id}`);
        if (cancelled) return;
        setMealGuestIds(mealGuests.map((g) => g.id));
      } catch {
        if (cancelled) return;
        setMealGuestIds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedMealId, selectedMeal, authedApi]);

  async function addMeal() {
    if (!newMealName.trim() || !newMealDate.trim()) {
      return;
    }

    setError(null);
    try {
      const meal = await authedApi<Meal>("/meals", {
        method: "POST",
        body: {
          name: newMealName.trim(),
          date: newMealDate.trim(),
          description: newMealDesc.trim() ? newMealDesc.trim() : null,
        },
      });
      setMeals((prev) => [meal, ...prev]);
      setNewMealName("");
      setNewMealDate("");
      setNewMealDesc("");
      setSelectedMealId(meal.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create meal");
    }
  }

  async function saveMeal() {
    if (!selectedMeal) {
      return;
    }

    setError(null);
    try {
      const updated = await authedApi<Meal>(`/meals/${selectedMeal.id}`, {
        method: "PUT",
        body: {
          name: editedName.trim(),
          date: editedDate.trim(),
          description: editedDesc.trim() ? editedDesc.trim() : null,
        },
      });
      setMeals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update meal");
    }
  }

  async function deleteMeal(mealId: string) {
    setError(null);
    try {
      await authedApi(`/meals/${mealId}`, { method: "DELETE" });
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
      if (selectedMealId === mealId) {
        setSelectedMealId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete meal");
    }
  }

  async function addGuestsToMeal() {
    if (!selectedMeal || selectedGuestIdsToAdd.length === 0) {
      return;
    }

    setError(null);
    try {
      const result = await authedApi<MealGuestJoin[]>(`/meals/${selectedMeal.id}`, {
        method: "POST",
        body: { guestIds: selectedGuestIdsToAdd },
      });
      const ids = result.map((j) => j.guestId);
      setMealGuestIds((prev) => Array.from(new Set([...prev, ...ids])));
      setSelectedGuestIdsToAdd([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to invite guests");
    }
  }

  async function removeGuestFromMeal(guestId: string) {
    if (!selectedMeal) {
      return;
    }

    setError(null);
    try {
      await authedApi(`/meals/${selectedMeal.id}/guests/${guestId}`, { method: "DELETE" });
      setMealGuestIds((prev) => prev.filter((id) => id !== guestId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove guest");
    }
  }

  async function loadMenu() {
    if (!selectedMeal) {
      return;
    }

    setMenuLoading(true);
    setError(null);
    try {
      const result = await authedApi<MenuResponse>(
        `/meals/${selectedMeal.id}/menu?includeUnsafe=${includeUnsafe ? "true" : "false"}`,
      );
      setMenu(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load menu");
    } finally {
      setMenuLoading(false);
    }
  }

  const invitedGuests = guests.filter((g) => mealGuestIds.includes(g.id));
  const availableGuests = guests.filter((g) => !mealGuestIds.includes(g.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Meals</h1>
        <p className="mt-1 text-sm text-slate-600">Create meals, invite guests, and view suggested menus.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Meals</div>
              <div className="mt-1 text-xs text-slate-500">Select a meal to manage guests and menu.</div>
            </div>
            <button
              type="button"
              onClick={() => void loadAll()}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-white p-4">
            <div className="text-sm font-medium">Create a meal</div>
            <div className="grid gap-2 md:grid-cols-3">
              <input
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
                placeholder="Meal name"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
              <input
                value={newMealDate}
                onChange={(e) => setNewMealDate(e.target.value)}
                placeholder="Date (YYYY-MM-DD)"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
              <button
                type="button"
                onClick={() => void addMeal()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Create
              </button>
            </div>
            <textarea
              value={newMealDesc}
              onChange={(e) => setNewMealDesc(e.target.value)}
              placeholder="Description (optional)"
              className="min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
          </div>

          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-white">
            {isLoading ? (
              <div className="p-4 text-sm text-slate-600">Loading…</div>
            ) : meals.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No meals yet. Create one above.</div>
            ) : (
              meals.map((meal) => (
                <div
                  key={meal.id}
                  className={[
                    "flex items-center justify-between gap-3 p-3",
                    selectedMealId === meal.id ? "bg-amber-50" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <button type="button" onClick={() => setSelectedMealId(meal.id)} className="flex-1 text-left">
                    <div className="text-sm font-medium">{meal.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{meal.date}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteMeal(meal.id)}
                    className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm">
          <div className="text-sm font-medium">Meal details</div>
          {selectedMeal ? (
            <div className="mt-4 space-y-6">
              <div className="space-y-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={editedDesc}
                    onChange={(e) => setEditedDesc(e.target.value)}
                    className="min-h-[110px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void saveMeal()}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
                >
                  Save meal
                </button>
              </div>

              <div>
                <div className="text-sm font-medium">Invited guests</div>
                <div className="mt-2 space-y-2">
                  {invitedGuests.length === 0 ? (
                    <div className="text-sm text-slate-600">No guests invited yet.</div>
                  ) : (
                    invitedGuests.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="text-sm">{guest.name}</div>
                        <button
                          type="button"
                          onClick={() => void removeGuestFromMeal(guest.id)}
                          className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900 hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
                  <div className="text-sm font-medium">Invite more guests</div>
                  <div className="mt-2 grid gap-2">
                    {availableGuests.length === 0 ? (
                      <div className="text-sm text-slate-600">All your guests are already invited.</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableGuests.map((guest) => {
                          const checked = selectedGuestIdsToAdd.includes(guest.id);
                          return (
                            <label
                              key={guest.id}
                              className={[
                                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                                checked ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white",
                              ].join(" ")}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedGuestIdsToAdd((prev) => {
                                    if (e.target.checked) {
                                      return [...prev, guest.id];
                                    }
                                    return prev.filter((id) => id !== guest.id);
                                  });
                                }}
                                className="h-4 w-4"
                              />
                              <span>{guest.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={selectedGuestIdsToAdd.length === 0}
                      onClick={() => void addGuestsToMeal()}
                      className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                    >
                      Invite selected
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Suggested menu</div>
                    <div className="mt-1 text-xs text-slate-500">Based on rankings and allergies.</div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeUnsafe}
                      onChange={(e) => setIncludeUnsafe(e.target.checked)}
                    />
                    Include unsafe dishes
                  </label>
                </div>

                <button
                  type="button"
                  disabled={menuLoading}
                  onClick={() => void loadMenu()}
                  className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {menuLoading ? "Loading…" : "Get menu"}
                </button>

                {menu ? (
                  <div className="mt-4 grid gap-3">
                    {([
                      ["Main", menu.main],
                      ["Side", menu.side],
                      ["Dessert", menu.dessert],
                      ["Other", menu.other],
                    ] as const).map(([label, items]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">{label}</div>
                          <div className="text-xs text-slate-500">{items.length} item(s)</div>
                        </div>

                        {items.length === 0 ? (
                          <div className="mt-2 text-sm text-slate-600">No suggestions yet.</div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {items.map((item) => (
                              <div key={item.dishId} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-medium">{item.name}</div>
                                  <div className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-700">
                                    avg {item.avgRank ?? "-"}
                                  </div>
                                </div>

                                {item.description ? (
                                  <div className="mt-1 text-xs text-slate-600">{item.description}</div>
                                ) : null}

                                {includeUnsafe && item.conflictingAllergies.length > 0 ? (
                                  <div className="mt-2 text-xs text-rose-800">
                                    Conflicts: {item.conflictingAllergies.join(", ")}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">Select a meal to manage it.</div>
          )}
        </div>
      </div>
    </div>
  );
}
