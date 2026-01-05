export type Allergy =
  | "gluten"
  | "dairy"
  | "eggs"
  | "fish"
  | "shellfish"
  | "peanuts"
  | "tree-nuts"
  | "soy"
  | "sesame";

export type DishCategory = "main" | "side" | "dessert" | "other";

export type Guest = {
  id: string;
  name: string;
  rankToken: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Dish = {
  id: string;
  name: string;
  description?: string | null;
  category: DishCategory;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Meal = {
  id: string;
  userId: string;
  date: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
