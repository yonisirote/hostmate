import { and, avg, eq, desc } from "drizzle-orm";

import { db } from "../dbConfig.js";
import { dishesRankTable, dishesTable, guestsTable, mealGuestsTable, mealsTable, type Meal } from "../schema.js";


export async function getMealsByUserId(userId: string) {
  const meals = await db.select().from(mealsTable).where(eq(mealsTable.userId, userId));
  return meals;
}

export async function getMealById(mealId: string) {
  const [meal] = await db.select().from(mealsTable).where(eq(mealsTable.id, mealId));
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
  const [mealGuest] = await db.insert(mealGuestsTable).values({
    mealId,
    guestId
  }).returning();
  return mealGuest;
}

export async function removeGuestFromMeal(mealId: string, guestId: string) {
  const result = await db.delete(mealGuestsTable)
    .where(and(
      eq(mealGuestsTable.mealId, mealId),
      eq(mealGuestsTable.guestId, guestId)
    ))
    .returning();
  return result;
}

export async function getMainMealRankings(mealId: string) {
  const mainDishRankings = await db
    .select({
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category,
      avgRank: avg(dishesRankTable.rank)
    }).from(mealGuestsTable)
    .innerJoin(dishesRankTable, eq(mealGuestsTable.guestId, dishesRankTable.guestId))
    .innerJoin(dishesTable, eq(dishesTable.id, dishesRankTable.dishId))
    .where(and(eq(mealGuestsTable.mealId, mealId), eq(dishesTable.category, 'main'))) 
    .groupBy(dishesTable.id)
    .orderBy(desc(avg(dishesRankTable.rank)));

  return mainDishRankings;
}

export async function getSideMealRankings(mealId: string) {
  const sideDishRankings = await db
    .select({
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category,
      avgRank: avg(dishesRankTable.rank)
    }).from(mealGuestsTable)
    .innerJoin(dishesRankTable, eq(mealGuestsTable.guestId, dishesRankTable.guestId))
    .innerJoin(dishesTable, eq(dishesTable.id, dishesRankTable.dishId))
    .where(and(eq(mealGuestsTable.mealId, mealId), eq(dishesTable.category, 'side'))) 
    .groupBy(dishesTable.id)
    .orderBy(desc(avg(dishesRankTable.rank)));

  return sideDishRankings;
}
export async function getDessertMealRankings(mealId: string) {
  const dessertDishRankings = await db
    .select({
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category,
      avgRank: avg(dishesRankTable.rank)
    }).from(mealGuestsTable)
    .innerJoin(dishesRankTable, eq(mealGuestsTable.guestId, dishesRankTable.guestId))
    .innerJoin(dishesTable, eq(dishesTable.id, dishesRankTable.dishId))
    .where(and(eq(mealGuestsTable.mealId, mealId), eq(dishesTable.category, 'dessert'))) 
    .groupBy(dishesTable.id)
    .orderBy(desc(avg(dishesRankTable.rank)));

  return dessertDishRankings;
} 


export async function getOtherMealRankings(mealId: string) {
  const otherDishRankings = await db
    .select({
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category,
      avgRank: avg(dishesRankTable.rank)
    }).from(mealGuestsTable)
    .innerJoin(dishesRankTable, eq(mealGuestsTable.guestId, dishesRankTable.guestId))
    .innerJoin(dishesTable, eq(dishesTable.id, dishesRankTable.dishId))
    .where(and(eq(mealGuestsTable.mealId, mealId), eq(dishesTable.category, 'other'))) 
    .groupBy(dishesTable.id)
    .orderBy(desc(avg(dishesRankTable.rank)));

  return otherDishRankings;
}

export async function deleteMeal(mealId: string) {
  await db.delete(mealsTable).where(eq(mealsTable.id, mealId));
}

export async function editMeal(mealId: string, mealDate: string, mealName: string, mealDescription?: string) {
  const updatedMeal = await db.update(mealsTable).set({
    date: mealDate,
    name: mealName,
    description: mealDescription
  }).where(eq(mealsTable.id, mealId)).returning();
  return updatedMeal;
}