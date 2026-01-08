export interface User {
  id: string;
  name: string;
  username: string;
}

export interface Guest {
  id: string;
  name: string;
  userId: string;
  rankToken: string;
}

export type DishCategory = 'main' | 'side' | 'dessert' | 'other';

export interface Dish {
  id: string;
  name: string;
  description: string | null;
  category: DishCategory;
  userId: string;
}

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

export const ALLERGIES: Allergy[] = [
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

export interface Meal {
  id: string;
  name: string;
  description: string | null;
  date: string;
  userId: string;
}

export interface Menu {
  main: Dish[];
  side: Dish[];
  dessert: Dish[];
  other: Dish[];
}

export type MenuCounts = {
  main: number;
  side: number;
  dessert: number;
  other: number;
};
