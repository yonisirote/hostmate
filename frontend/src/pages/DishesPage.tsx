import * as React from "react";

import { useAuthedApi } from "../lib/use-authed-api";
import type { Allergy, Dish, DishCategory } from "../lib/types";

const CATEGORIES: DishCategory[] = ["main", "side", "dessert", "other"];

const ALLERGIES: Allergy[] = [
  "gluten",
  "dairy",
  "eggs",
  "fish",
  "shellfish",
  "peanuts",
  "tree-nuts",
  "soy",
  "sesame",
];

export function DishesPage() {
  const authedApi = useAuthedApi();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dishes, setDishes] = React.useState<Dish[]>([]);

  const [newName, setNewName] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<DishCategory>("other");
  const [newDescription, setNewDescription] = React.useState("");

  const [selectedDishId, setSelectedDishId] = React.useState<string | null>(null);
  const selectedDish = dishes.find((dish) => dish.id === selectedDishId) ?? null;

  const [editedName, setEditedName] = React.useState("");
  const [editedCategory, setEditedCategory] = React.useState<DishCategory>("other");
  const [editedDescription, setEditedDescription] = React.useState("");

  const [dishAllergens, setDishAllergens] = React.useState<Allergy[]>([]);
  const [savingDish, setSavingDish] = React.useState(false);
  const [savingAllergens, setSavingAllergens] = React.useState(false);

  async function loadDishes() {
    setIsLoading(true);
    setError(null);
    try {
      const list = await authedApi<Dish[]>("/dishes");
      setDishes(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dishes");
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    void loadDishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!selectedDish) {
      setEditedName("");
      setEditedCategory("other");
      setEditedDescription("");
      setDishAllergens([]);
      return;
    }

    setEditedName(selectedDish.name);
    setEditedCategory(selectedDish.category);
    setEditedDescription(selectedDish.description ?? "");

    let cancelled = false;
    (async () => {
      try {
        const allergies = await authedApi<Allergy[]>(`/allergies/dishes/${selectedDish.id}`);
        if (!cancelled) {
          setDishAllergens(allergies);
        }
      } catch {
        if (!cancelled) {
          setDishAllergens([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDishId, selectedDish, authedApi]);

  async function addDish() {
    if (!newName.trim()) {
      return;
    }

    setError(null);
    try {
      const dish = await authedApi<Dish>("/dishes", {
        method: "POST",
        body: {
          name: newName.trim(),
          category: newCategory,
          description: newDescription.trim() ? newDescription.trim() : null,
        },
      });
      setDishes((prev) => [dish, ...prev]);
      setNewName("");
      setNewDescription("");
      setNewCategory("other");
      setSelectedDishId(dish.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add dish");
    }
  }

  async function saveDish() {
    if (!selectedDish) {
      return;
    }

    setSavingDish(true);
    setError(null);
    try {
      const updated = await authedApi<Dish>(`/dishes/${selectedDish.id}`, {
        method: "PUT",
        body: {
          name: editedName.trim(),
          category: editedCategory,
          description: editedDescription.trim() ? editedDescription.trim() : null,
        },
      });
      setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update dish");
    } finally {
      setSavingDish(false);
    }
  }

  async function deleteDish(dishId: string) {
    setError(null);
    try {
      await authedApi(`/dishes/${dishId}`, { method: "DELETE" });
      setDishes((prev) => prev.filter((d) => d.id !== dishId));
      if (selectedDishId === dishId) {
        setSelectedDishId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete dish");
    }
  }

  async function saveAllergens() {
    if (!selectedDish) {
      return;
    }

    setSavingAllergens(true);
    setError(null);
    try {
      const result = await authedApi<Allergy[]>(`/allergies/dishes/${selectedDish.id}`, {
        method: "PUT",
        body: { allergies: dishAllergens },
      });
      setDishAllergens(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save dish allergens");
    } finally {
      setSavingAllergens(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dishes</h1>
        <p className="mt-1 text-sm text-slate-600">Your personal dish collection, with allergens.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Dish list</div>
              <div className="mt-1 text-xs text-slate-500">Select a dish to edit details and allergens.</div>
            </div>
            <button
              type="button"
              onClick={() => void loadDishes()}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-white p-4">
            <div className="text-sm font-medium">Add a new dish</div>
            <div className="grid gap-2 md:grid-cols-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Dish name"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as DishCategory)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void addDish()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Add
              </button>
            </div>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
          </div>

          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-white">
            {isLoading ? (
              <div className="p-4 text-sm text-slate-600">Loading…</div>
            ) : dishes.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No dishes yet. Add your first one above.</div>
            ) : (
              dishes.map((dish) => (
                <div
                  key={dish.id}
                  className={[
                    "flex items-center justify-between gap-3 p-3",
                    selectedDishId === dish.id ? "bg-amber-50" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <button type="button" onClick={() => setSelectedDishId(dish.id)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{dish.name}</div>
                      <div className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                        {dish.category}
                      </div>
                    </div>
                    {dish.description ? (
                      <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{dish.description}</div>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteDish(dish.id)}
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
          <div className="text-sm font-medium">Dish details</div>
          {selectedDish ? (
            <div className="mt-4 space-y-5">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value as DishCategory)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="min-h-[120px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <button
                type="button"
                disabled={savingDish}
                onClick={() => void saveDish()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {savingDish ? "Saving…" : "Save changes"}
              </button>

              <div>
                <div className="text-sm font-medium">Allergens</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ALLERGIES.map((allergy) => {
                    const checked = dishAllergens.includes(allergy);
                    return (
                      <label
                        key={allergy}
                        className={[
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                          checked ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setDishAllergens((prev) => {
                              if (e.target.checked) {
                                return [...prev, allergy];
                              }
                              return prev.filter((a) => a !== allergy);
                            });
                          }}
                          className="h-4 w-4"
                        />
                        <span className="capitalize">{allergy.replace("-", " ")}</span>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={savingAllergens}
                  onClick={() => void saveAllergens()}
                  className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingAllergens ? "Saving…" : "Save allergens"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">Select a dish to edit it.</div>
          )}
        </div>
      </div>
    </div>
  );
}
