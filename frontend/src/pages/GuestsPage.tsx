import * as React from "react";

import { useAuthedApi } from "../lib/use-authed-api";
import type { Allergy, Guest } from "../lib/types";

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

function buildGuestRankLink(rankToken: string) {
  // Guest-facing page not built yet; this still gives the share token.
  return `${window.location.origin}/guest/${rankToken}`;
}

export function GuestsPage() {
  const authedApi = useAuthedApi();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = React.useState("");

  const [selectedGuestId, setSelectedGuestId] = React.useState<string | null>(null);
  const selectedGuest = guests.find((guest) => guest.id === selectedGuestId) ?? null;

  const [selectedAllergies, setSelectedAllergies] = React.useState<Allergy[]>([]);
  const [savingAllergies, setSavingAllergies] = React.useState(false);

  const [isSavingName, setIsSavingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState("");

  async function loadGuests() {
    setIsLoading(true);
    setError(null);
    try {
      const list = await authedApi<Guest[]>("/guests");
      setGuests(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load guests");
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    void loadGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!selectedGuestId) {
      setSelectedAllergies([]);
      setEditedName("");
      return;
    }

    const guest = guests.find((g) => g.id === selectedGuestId);
    if (!guest) {
      return;
    }

    setEditedName(guest.name);

    let cancelled = false;
    (async () => {
      try {
        const allergies = await authedApi<Allergy[]>(`/allergies/guests/${selectedGuestId}`);
        if (!cancelled) {
          setSelectedAllergies(allergies);
        }
      } catch {
        if (!cancelled) {
          setSelectedAllergies([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedGuestId, guests, authedApi]);

  async function addGuest() {
    if (!newGuestName.trim()) {
      return;
    }

    setError(null);
    try {
      const guest = await authedApi<Guest>("/guests", {
        method: "POST",
        body: { name: newGuestName.trim() },
      });
      setGuests((prev) => [guest, ...prev]);
      setNewGuestName("");
      setSelectedGuestId(guest.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add guest");
    }
  }

  async function saveGuestName() {
    if (!selectedGuestId) {
      return;
    }

    setIsSavingName(true);
    setError(null);
    try {
      const updated = await authedApi<Guest>(`/guests/${selectedGuestId}`, {
        method: "PUT",
        body: { name: editedName.trim() },
      });
      setGuests((prev) => prev.map((g) => (g.id === selectedGuestId ? updated : g)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update guest");
    } finally {
      setIsSavingName(false);
    }
  }

  async function deleteGuest(guestId: string) {
    setError(null);
    try {
      await authedApi(`/guests/${guestId}`, { method: "DELETE" });
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
      if (selectedGuestId === guestId) {
        setSelectedGuestId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete guest");
    }
  }

  async function saveAllergies() {
    if (!selectedGuestId) {
      return;
    }

    setSavingAllergies(true);
    setError(null);
    try {
      const result = await authedApi<Allergy[]>(`/allergies/guests/${selectedGuestId}`, {
        method: "PUT",
        body: { allergies: selectedAllergies },
      });
      setSelectedAllergies(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save allergies");
    } finally {
      setSavingAllergies(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Guests</h1>
        <p className="mt-1 text-sm text-slate-600">Create guests, set allergies, and share ranking links.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Your guest list</div>
              <div className="mt-1 text-xs text-slate-500">Pick a guest to manage allergies and links.</div>
            </div>
            <button
              type="button"
              onClick={() => void loadGuests()}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              placeholder="Add a guest (e.g., Alex)"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            <button
              type="button"
              onClick={() => void addGuest()}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Add
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-white">
            {isLoading ? (
              <div className="p-4 text-sm text-slate-600">Loading…</div>
            ) : guests.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No guests yet. Add your first one above.</div>
            ) : (
              guests.map((guest) => (
                <div
                  key={guest.id}
                  className={[
                    "flex items-center justify-between gap-3 p-3",
                    selectedGuestId === guest.id ? "bg-amber-50" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedGuestId(guest.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-medium">{guest.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">Token: {guest.rankToken}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteGuest(guest.id)}
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
          <div className="text-sm font-medium">Guest details</div>
          {selectedGuest ? (
            <div className="mt-4 space-y-5">
              <div>
                <label className="text-sm font-medium">Name</label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                  <button
                    type="button"
                    disabled={isSavingName}
                    onClick={() => void saveGuestName()}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isSavingName ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Share link</div>
                <div className="mt-1 text-xs text-slate-600">
                  This is the link you can send the guest to rank dishes.
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    readOnly
                    value={buildGuestRankLink(selectedGuest.rankToken)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(buildGuestRankLink(selectedGuest.rankToken))}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Allergies</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ALLERGIES.map((allergy) => {
                    const checked = selectedAllergies.includes(allergy);
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
                            setSelectedAllergies((prev) => {
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
                  disabled={savingAllergies}
                  onClick={() => void saveAllergies()}
                  className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingAllergies ? "Saving…" : "Save allergies"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">Select a guest to manage details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
