import { and, avg, desc, eq, inArray, notExists } from "drizzle-orm";

import { db } from "../dbConfig.js";
import {
  dishAllergensTable,
  dishesRankTable,
  dishesTable,
  guestAllergiesTable,
  guestsTable,
  mealGuestsTable,
  mealsTable,
  type Allergy,
  type Meal,
} from "../schema.js";

export async function getMealsByUserId(userId: string) {
  const meals = await db
    .select()
    .from(mealsTable)
    .where(eq(mealsTable.userId, userId));
  return meals;
}

export async function getMealById(mealId: string) {
  const [meal] = await db
    .select()
    .from(mealsTable)
    .where(eq(mealsTable.id, mealId));
  return meal;
}

export async function getMealGuests(mealId: string) {
  const guests = await db
    .select({
      id: guestsTable.id,
      name: guestsTable.name,
    })
    .from(mealGuestsTable)
    .innerJoin(guestsTable, eq(guestsTable.id, mealGuestsTable.guestId))
    .where(eq(mealGuestsTable.mealId, mealId));

  return guests;
}

export async function addMeal(meal: Meal) {
  const [newMeal] = await db.insert(mealsTable).values(meal).returning();
  return newMeal;
}

export async function addGuestToMeal(mealId: string, guestId: string) {
  const [mealGuest] = await db
    .insert(mealGuestsTable)
    .values({
      mealId,
      guestId,
    })
    .returning();
  return mealGuest;
}

export async function removeGuestFromMeal(mealId: string, guestId: string) {
  const result = await db
    .delete(mealGuestsTable)
    .where(
      and(
        eq(mealGuestsTable.mealId, mealId),
        eq(mealGuestsTable.guestId, guestId),
      ),
    )
    .returning();
  return result;
}

function getAllergySafeWhere(mealId: string, includeUnsafe: boolean) {
  if (includeUnsafe) {
    return eq(mealGuestsTable.mealId, mealId);
  }

  // Exclude dishes that have an allergen matching ANY allergy of ANY guest in the meal.
  // Important: the subquery must be correlated by `mealId` (not the outer guest row),
  // otherwise a dish can slip through based on a different guest's ranking row.
  return and(
    eq(mealGuestsTable.mealId, mealId),
    notExists(
      db
        .select({ one: dishAllergensTable.allergy })
        .from(dishAllergensTable)
        .innerJoin(
          guestAllergiesTable,
          eq(guestAllergiesTable.allergy, dishAllergensTable.allergy),
        )
        .innerJoin(
          mealGuestsTable,
          eq(mealGuestsTable.guestId, guestAllergiesTable.guestId),
        )
        .where(
          and(
            eq(mealGuestsTable.mealId, mealId),
            eq(dishAllergensTable.dishId, dishesTable.id),
          ),
        ),
    ),
  );
}

async function getDishAllergenConflicts(
  dishIds: string[],
  mealId: string,
): Promise<Record<string, Allergy[]>> {
  if (dishIds.length === 0) {
    return {};
  }

  const rows = await db
    .select({
      dishId: dishAllergensTable.dishId,
      allergy: dishAllergensTable.allergy,
    })
    .from(dishAllergensTable)
    .innerJoin(
      guestAllergiesTable,
      eq(guestAllergiesTable.allergy, dishAllergensTable.allergy),
    )
    .innerJoin(
      mealGuestsTable,
      eq(mealGuestsTable.guestId, guestAllergiesTable.guestId),
    )
    .where(
      and(
        eq(mealGuestsTable.mealId, mealId),
        inArray(dishAllergensTable.dishId, dishIds),
      ),
    )
    .groupBy(dishAllergensTable.dishId, dishAllergensTable.allergy);

  const result: Record<string, Allergy[]> = {};
  for (const row of rows) {
    if (!result[row.dishId]) {
      result[row.dishId] = [];
    }
    result[row.dishId]!.push(row.allergy);
  }

  return result;
}

export async function getMainMealRankings(
  mealId: string,
  includeUnsafe = false,
) {
  const mainDishRankings = await db
    .select({
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category,
      avgRank: avg(dishesRankTable.rank),
    })
    .from(mealGuestsTable)
    .innerJoin(
      dishesRankTable,
      eq(mealGuestsTable.guestId, dishesRankTable.guestId),
    )
    .innerJoin(dishesTable, eq(dishesTable.id, dishesRankTable.dishId))
    .where(
      and(
        getAllergySafeWhere(mealId, includeUnsafe),
        eq(dishesTable.category, "main"),
      ),
    )
    .groupBy(dishesTable.id)
    .orderBy(desc(avg(dishesRankTable.rank)));

  if (!includeUnsafe) {
    return mainDishRankings.map((row) => ({
      ...row,
      conflictingAllergies: [] as Allergy[],
    }));
  }

  const conflicts = await getDishAllergenConflicts(
    mainDishRankings.map((row) => row.dishId),
    mealId,
  );

  return mainDishRankings.map((row) => ({
    ...row,
    conflictingAllergies: conflicts[row.dishId] ?? [],
  }));
}

export async function getSideMealRankings(
  mealId: string,
  includeUnsafe = false,
) {
  const sideDishRankings = await db
    .select({
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category,
      avgRank: avg(dishesRankTable.rank),
    })
    .from(mealGuestsTable)
    .innerJoin(
      dishesRankTable,
      eq(mealGuestsTable.guestId, dishesRankTable.guestId),
    )
    .innerJoin(dishesTable, eq(dishesTable.id, dishesRankTable.dishId))
    .where(
      and(
        getAllergySafeWhere(mealId, includeUnsafe),
        eq(dishesTable.category, "side"),
      ),
    )
    .groupBy(dishesTable.id)
    .orderBy(desc(avg(dishesRankTable.rank)));

  if (!includeUnsafe) {
    return sideDishRankings.map((row) => ({
      ...row,
      conflictingAllergies: [] as Allergy[],
    }));
  }

  const conflicts = await getDishAllergenConflicts(
    sideDishRankings.map((row) => row.dishId),
    mealId,
  );

  return sideDishRankings.map((row) => ({
    ...row,
    conflictingAllergies: conflicts[row.dishId] ?? [],
  }));
}

export async function getDessertMealRankings(
  mealId: string,
  includeUnsafe = false,
) {
  const dessertDishRankings = await db
    .select({
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category,
      avgRank: avg(dishesRankTable.rank),
    })
    .from(mealGuestsTable)
    .innerJoin(
      dishesRankTable,
      eq(mealGuestsTable.guestId, dishesRankTable.guestId),
    )
    .innerJoin(dishesTable, eq(dishesTable.id, dishesRankTable.dishId))
    .where(
      and(
        getAllergySafeWhere(mealId, includeUnsafe),
        eq(dishesTable.category, "dessert"),
      ),
    )
    .groupBy(dishesTable.id)
    .orderBy(desc(avg(dishesRankTable.rank)));

  if (!includeUnsafe) {
    return dessertDishRankings.map((row) => ({
      ...row,
      conflictingAllergies: [] as Allergy[],
    }));
  }

  const conflicts = await getDishAllergenConflicts(
    dessertDishRankings.map((row) => row.dishId),
    mealId,
  );

  return dessertDishRankings.map((row) => ({
    ...row,
    conflictingAllergies: conflicts[row.dishId] ?? [],
  }));
}

export async function getOtherMealRankings(
  mealId: string,
  includeUnsafe = false,
) {
  const otherDishRankings = await db
    .select({
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category,
      avgRank: avg(dishesRankTable.rank),
    })
    .from(mealGuestsTable)
    .innerJoin(
      dishesRankTable,
      eq(mealGuestsTable.guestId, dishesRankTable.guestId),
    )
    .innerJoin(dishesTable, eq(dishesTable.id, dishesRankTable.dishId))
    .where(
      and(
        getAllergySafeWhere(mealId, includeUnsafe),
        eq(dishesTable.category, "other"),
      ),
    )
    .groupBy(dishesTable.id)
    .orderBy(desc(avg(dishesRankTable.rank)));

  if (!includeUnsafe) {
    return otherDishRankings.map((row) => ({
      ...row,
      conflictingAllergies: [] as Allergy[],
    }));
  }

  const conflicts = await getDishAllergenConflicts(
    otherDishRankings.map((row) => row.dishId),
    mealId,
  );

  return otherDishRankings.map((row) => ({
    ...row,
    conflictingAllergies: conflicts[row.dishId] ?? [],
  }));
}

export async function deleteMeal(mealId: string) {
  await db.delete(mealsTable).where(eq(mealsTable.id, mealId));
}

export async function editMeal(
  mealId: string,
  mealDate: string,
  mealName: string,
  mealDescription?: string,
) {
  const updatedMeal = await db
    .update(mealsTable)
    .set({
      date: mealDate,
      name: mealName,
      description: mealDescription,
    })
    .where(eq(mealsTable.id, mealId))
    .returning();
  return updatedMeal;
}
