import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import type { Dish, DishCategory } from "../types";
import { updateDish } from "../api/dishesApi";
import { fetchDishAllergens, setDishAllergens } from "../../allergies/api/allergiesApi";
import { ALLERGIES } from "../../allergies/constants";
import type { Allergy } from "../../allergies/constants";

type EditDishModalProps = {
  dish: Dish;
  onClose: () => void;
  onUpdated: () => Promise<void>;
};

const CATEGORY_OPTIONS: DishCategory[] = ["main", "side", "dessert", "other"];

export function EditDishModal({ dish, onClose, onUpdated }: EditDishModalProps) {
  const [name, setName] = useState(dish.name);
  const [description, setDescription] = useState(dish.description ?? "");
  const [category, setCategory] = useState<DishCategory>(dish.category ?? "other");
  const [selectedAllergens, setSelectedAllergens] = useState<Allergy[]>([]);
  const [loadingAllergens, setLoadingAllergens] = useState(false);
  const [allergensLoadError, setAllergensLoadError] = useState<string | null>(null);
  const [allergensReadOnly, setAllergensReadOnly] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(dish.name);
    setDescription(dish.description ?? "");
    setCategory(dish.category ?? "other");
    setAllergensReadOnly(true);
  }, [dish]);

  useEffect(() => {
    let cancelled = false;
    setLoadingAllergens(true);
    setAllergensLoadError(null);

    void fetchDishAllergens(dish.id)
      .then((allergens) => {
        if (cancelled) return;
        setSelectedAllergens(allergens);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (cancelled) return;
        setAllergensLoadError("Failed to load allergens");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAllergens(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dish.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      toast.error("Please enter a dish name");
      return;
    }

    setSubmitting(true);
    try {
      await updateDish(dish.id, {
        name: trimmedName,
        description: trimmedDescription || undefined,
        category,
      });
      if (!allergensReadOnly) {
        await setDishAllergens(dish.id, selectedAllergens);
      }
      toast.success("Dish updated");
      onClose();
      await onUpdated();
    } catch (error: unknown) {
      let message = "Failed to update dish";
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        message = response?.data?.message ?? message;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const canDismiss = !submitting;
  const canEditAllergens = !allergensReadOnly && !loadingAllergens && !submitting;

  const toggleAllergen = (allergy: Allergy) => {
    if (!canEditAllergens) {
      return;
    }
    setSelectedAllergens((prev) => (prev.includes(allergy) ? prev.filter((item) => item !== allergy) : [...prev, allergy]));
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1c12]/40 px-3 py-6 sm:px-4 sm:py-8"
      onClick={() => {
        if (!canDismiss) return;
        onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_35px_80px_-35px_rgba(167,112,68,0.6)] backdrop-blur sm:rounded-3xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a77044]">Edit dish</h3>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d37655] underline decoration-dotted disabled:opacity-60"
              onClick={() => {
                if (!canDismiss) return;
                onClose();
              }}
              disabled={!canDismiss}
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]" htmlFor="edit-dish-name">
              Dish name
            </label>
            <input
              id="edit-dish-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-[#f5d8b4] bg-white/90 px-4 py-2 text-sm text-[#3f2a1d] focus:outline-none focus:ring-2 focus:ring-[#d37655]/50"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]" htmlFor="edit-dish-description">
              Description
            </label>
            <textarea
              id="edit-dish-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#f5d8b4] bg-white/90 px-4 py-2 text-sm text-[#3f2a1d] focus:outline-none focus:ring-2 focus:ring-[#d37655]/50"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]" htmlFor="edit-dish-category">
              Category
            </label>
            <select
              id="edit-dish-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as DishCategory)}
              className="w-full rounded-xl border border-[#f5d8b4] bg-white/90 px-4 py-2 text-sm text-[#3f2a1d] focus:outline-none focus:ring-2 focus:ring-[#d37655]/50"
              disabled={submitting}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]">Allergens in dish</div>
                <div className="text-xs text-[#6f5440]">
                  {allergensReadOnly ? "Viewing" : "Editing"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044] underline decoration-dotted disabled:opacity-60"
                  onClick={() => setAllergensReadOnly(true)}
                  disabled={submitting || loadingAllergens}
                >
                  View
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d37655] underline decoration-dotted disabled:opacity-60"
                  onClick={() => {
                    if (allergensLoadError) {
                      toast.error("Cannot edit allergens until they load");
                      return;
                    }
                    setAllergensReadOnly(false);
                  }}
                  disabled={submitting || loadingAllergens}
                >
                  Edit
                </button>
              </div>
            </div>
            {loadingAllergens ? (
              <div className="text-xs text-[#6f5440]">Loading allergens...</div>
            ) : allergensLoadError ? (
              <div className="space-y-1">
                <div className="text-xs text-[#d37655]">{allergensLoadError}</div>
                <div className="text-xs text-[#6f5440]">Your current selection was not changed.</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm text-[#3f2a1d]">
                {ALLERGIES.map((allergy) => (
                  <label key={allergy} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAllergens.includes(allergy)}
                      onChange={() => toggleAllergen(allergy)}
                      disabled={!canEditAllergens}
                    />
                    <span className="capitalize">{allergy.replace(/-/g, " ")}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#d37655] px-5 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:opacity-70"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="text-sm font-medium text-[#a15a38] underline decoration-[#f5d8b4] underline-offset-4 transition hover:text-[#d37655] disabled:opacity-60"
              onClick={() => {
                if (!canDismiss) return;
                onClose();
              }}
              disabled={!canDismiss}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
