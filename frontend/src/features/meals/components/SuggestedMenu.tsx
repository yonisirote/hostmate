import { MENU_CATEGORIES, MENU_CATEGORY_LABELS } from "../types";
import type { SuggestedMenuByCategory } from "../types";

interface SuggestedMenuProps {
  menuItems: SuggestedMenuByCategory;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  mealHasItems: boolean;
  includeUnsafe: boolean;
  onToggleIncludeUnsafe: (next: boolean) => void;
}

export function SuggestedMenu({
  menuItems,
  isLoading,
  error,
  onRefresh,
  mealHasItems,
  includeUnsafe,
  onToggleIncludeUnsafe,
}: SuggestedMenuProps) {
  return (
    <div className="mt-4 rounded-xl border border-[#eee] bg-white p-3 text-sm text-[#3f2a1d]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold">Suggested menu</div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#6f5440]">
            <input
              type="checkbox"
              checked={includeUnsafe}
              onChange={(event) => onToggleIncludeUnsafe(event.target.checked)}
              disabled={isLoading}
            />
            Show dishes with allergies
          </label>
          <button
            type="button"
            className="text-xs font-medium text-[#d37655] underline decoration-dotted underline-offset-2 disabled:opacity-60"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      <div className="mb-3 text-xs text-[#6f5440]">Suggestions are based on dishes your guests have ranked.</div>
      {isLoading ? (
        <div className="text-xs text-[#6f5440]">Loading suggested menu...</div>
      ) : error ? (
        <div className="text-xs text-red-500">{error}</div>
      ) : mealHasItems ? (
        <div className="space-y-3">
          {MENU_CATEGORIES.map((category) => {
            const categoryItems = menuItems?.[category] ?? [];
            if (categoryItems.length === 0) return null;
            return (
              <div key={category}>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]">
                  {MENU_CATEGORY_LABELS[category]}
                </div>
                <ul className="mt-1 space-y-1">
                  {categoryItems.map((item) => {
                    const hasConflicts = item.conflictingAllergies && item.conflictingAllergies.length > 0;
                    return (
                      <li key={item.id ?? `${category}-${item.dishId}`} className="text-sm">
                        <span className="font-medium">{item.name ?? item.dishId}</span>
                        {typeof item.avgRank === "number" ? (
                          <span className="ml-2 text-xs text-[#6f5440]">Avg: {item.avgRank.toFixed(1)}</span>
                        ) : (
                          <span className="ml-2 text-xs text-[#6f5440]">Avg: —</span>
                        )}
                        {item.note ? <span className="ml-2 text-xs text-[#6f5440]">— {item.note}</span> : null}
                        {hasConflicts ? (
                          <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                            {item.conflictingAllergies!.map((a) => a.replace(/-/g, " ")).join(", ")}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-[#6f5440]">No suggested items.</div>
      )}
    </div>
  );
}
