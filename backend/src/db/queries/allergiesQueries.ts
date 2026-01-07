import { eq, inArray } from "drizzle-orm";

import { db } from "../dbConfig.js";
import { dishAllergensTable, guestAllergiesTable, mealGuestsTable, type Allergy } from "../schema.js";

export async function getGuestAllergies(guestId: string) {
  const rows = await db
    .select({ allergy: guestAllergiesTable.allergy })
    .from(guestAllergiesTable)
    .where(eq(guestAllergiesTable.guestId, guestId));

  return rows.map((row) => row.allergy);
}

export async function setGuestAllergies(guestId: string, allergies: Allergy[]) {
  return await db.transaction(async (tx) => {
    await tx.delete(guestAllergiesTable).where(eq(guestAllergiesTable.guestId, guestId));
    if (allergies.length === 0) {
      return [];
    }

    const rows = await tx
      .insert(guestAllergiesTable)
      .values(allergies.map((allergy) => ({ guestId, allergy })))
      .returning();

    return rows;
  });
}

export async function getDishAllergens(dishId: string) {
  const rows = await db
    .select({ allergy: dishAllergensTable.allergy })
    .from(dishAllergensTable)
    .where(eq(dishAllergensTable.dishId, dishId));

  return rows.map((row) => row.allergy);
}

export async function getGuestAllergiesMap(guestIds: string[]) {
  if (guestIds.length === 0) {
    return {} as Record<string, Allergy[]>;
  }

  const rows = await db
    .select({ guestId: guestAllergiesTable.guestId, allergy: guestAllergiesTable.allergy })
    .from(guestAllergiesTable)
    .where(inArray(guestAllergiesTable.guestId, guestIds));

  const map: Record<string, Allergy[]> = {};
  for (const guestId of guestIds) {
    map[guestId] = [];
  }

  for (const row of rows) {
    const allergies = map[row.guestId];
    if (allergies) {
      allergies.push(row.allergy);
    }
  }

  return map;
}

export async function getDishAllergensMap(dishIds: string[]) {
  if (dishIds.length === 0) {
    return {} as Record<string, Allergy[]>;
  }

  const rows = await db
    .select({ dishId: dishAllergensTable.dishId, allergy: dishAllergensTable.allergy })
    .from(dishAllergensTable)
    .where(inArray(dishAllergensTable.dishId, dishIds));

  const map: Record<string, Allergy[]> = {};
  for (const dishId of dishIds) {
    map[dishId] = [];
  }

  for (const row of rows) {
    const allergens = map[row.dishId];
    if (allergens) {
      allergens.push(row.allergy);
    }
  }

  return map;
}

export async function setDishAllergens(dishId: string, allergies: Allergy[]) {
  return await db.transaction(async (tx) => {
    await tx.delete(dishAllergensTable).where(eq(dishAllergensTable.dishId, dishId));
    if (allergies.length === 0) {
      return [];
    }

    const rows = await tx
      .insert(dishAllergensTable)
      .values(allergies.map((allergy) => ({ dishId, allergy })))
      .returning();

    return rows;
  });
}

export async function getMealAllergies(mealId: string) {
  const rows = await db
    .select({ allergy: guestAllergiesTable.allergy })
    .from(mealGuestsTable)
    .innerJoin(guestAllergiesTable, eq(mealGuestsTable.guestId, guestAllergiesTable.guestId))
    .where(eq(mealGuestsTable.mealId, mealId));

  return Array.from(new Set(rows.map((row) => row.allergy)));
}
