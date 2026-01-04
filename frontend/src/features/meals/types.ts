export type Meal = {
  id: string;
  name: string;
  description?: string;
  date: string;
  created_at?: string;
  updated_at?: string;
};

export type MealGuest = {
  id: string;
  name: string;
};

export type SuggestedMenuItem = {
  id: string;
  dishId: string;
  name?: string;
  note?: string;
  avgRank?: number | null;
  category?: string;
  description?: string;
  conflictingAllergies?: string[];
};

export const MENU_CATEGORIES = ["main", "side", "dessert", "other"] as const;
export type MenuCategory = typeof MENU_CATEGORIES[number];

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  main: "Main dishes",
  side: "Side dishes",
  dessert: "Desserts",
  other: "Other",
};

export type SuggestedMenuByCategory = Record<MenuCategory, SuggestedMenuItem[]>;
export type SuggestedMenuResponse = Partial<Record<MenuCategory, SuggestedMenuItem[]>>;

export type GuestDishRank = {
  id: string;
  dish_id: string;
  dishId?: string;
  rank: number;
  name?: string;
  description?: string;
};

export type GuestOption = MealGuest;
