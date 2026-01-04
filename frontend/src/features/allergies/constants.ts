export const ALLERGIES = [
  "gluten",
  "dairy",
  "eggs",
  "fish",
  "shellfish",
  "peanuts",
  "tree-nuts",
  "soy",
  "sesame",
] as const;

export type Allergy = typeof ALLERGIES[number];
