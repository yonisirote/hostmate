import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import type { Guest } from "../types";
import { updateGuest } from "../api/guestsApi";
import { fetchGuestAllergies, setGuestAllergies } from "../../allergies/api/allergiesApi";
import { ALLERGIES } from "../../allergies/constants";
import type { Allergy } from "../../allergies/constants";

type EditGuestModalProps = {
  guest: Guest;
  onClose: () => void;
  onUpdated: () => Promise<void>;
};

export function EditGuestModal({ guest, onClose, onUpdated }: EditGuestModalProps) {
  const [name, setName] = useState(guest.name);
  const [selectedAllergies, setSelectedAllergies] = useState<Allergy[]>([]);
  const [loadingAllergies, setLoadingAllergies] = useState(false);
  const [allergiesLoadError, setAllergiesLoadError] = useState<string | null>(null);
  const [allergiesReadOnly, setAllergiesReadOnly] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(guest.name);
    setAllergiesReadOnly(true);
  }, [guest]);

  useEffect(() => {
    let cancelled = false;
    setLoadingAllergies(true);
    setAllergiesLoadError(null);

    void fetchGuestAllergies(guest.id)
      .then((allergies) => {
        if (cancelled) return;
        setSelectedAllergies(allergies);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (cancelled) return;
        setAllergiesLoadError("Failed to load allergies");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAllergies(false);
      });

    return () => {
      cancelled = true;
    };
  }, [guest.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please enter a guest name");
      return;
    }
    setSubmitting(true);
    try {
      await updateGuest(guest.id, { name: trimmedName });
      if (!allergiesReadOnly) {
        await setGuestAllergies(guest.id, selectedAllergies);
      }
      toast.success("Guest updated");
      onClose();
      await onUpdated();
    } catch (error: unknown) {
      let message = "Failed to update guest";
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
  const canEditAllergies = !allergiesReadOnly && !loadingAllergies && !submitting;

  const toggleAllergy = (allergy: Allergy) => {
    if (!canEditAllergies) {
      return;
    }
    setSelectedAllergies((prev) => (prev.includes(allergy) ? prev.filter((item) => item !== allergy) : [...prev, allergy]));
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
        className="w-full max-w-sm rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_35px_80px_-35px_rgba(167,112,68,0.6)] backdrop-blur sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a77044]">Edit guest</h3>
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
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]" htmlFor="guest-name">
              Guest name
            </label>
            <input
              id="guest-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-[#f5d8b4] bg-white/90 px-4 py-2 text-sm text-[#3f2a1d] focus:outline-none focus:ring-2 focus:ring-[#d37655]/50"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]">Allergies</div>
                <div className="text-xs text-[#6f5440]">
                  {allergiesReadOnly ? "Viewing" : "Editing"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044] underline decoration-dotted disabled:opacity-60"
                  onClick={() => setAllergiesReadOnly(true)}
                  disabled={submitting || loadingAllergies}
                >
                  View
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d37655] underline decoration-dotted disabled:opacity-60"
                  onClick={() => {
                    if (allergiesLoadError) {
                      toast.error("Cannot edit allergies until they load");
                      return;
                    }
                    setAllergiesReadOnly(false);
                  }}
                  disabled={submitting || loadingAllergies}
                >
                  Edit
                </button>
              </div>
            </div>
            {loadingAllergies ? (
              <div className="text-xs text-[#6f5440]">Loading allergies...</div>
            ) : allergiesLoadError ? (
              <div className="space-y-1">
                <div className="text-xs text-[#d37655]">{allergiesLoadError}</div>
                <div className="text-xs text-[#6f5440]">Your current selection was not changed.</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm text-[#3f2a1d]">
                {ALLERGIES.map((allergy) => (
                  <label key={allergy} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAllergies.includes(allergy)}
                      onChange={() => toggleAllergy(allergy)}
                      disabled={!canEditAllergies}
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
