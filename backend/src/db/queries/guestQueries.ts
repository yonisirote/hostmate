import { db } from "../dbConfig.js";
import { and, eq } from "drizzle-orm";
import { dishesRankTable, dishesTable, guestsTable, type Guest } from "../schema.js";


export async function getGuests(){
    const guests = await db.select().from(guestsTable).orderBy(guestsTable.name);
    return guests;
}


export async function addGuest(newGuest: Guest){
    const [guest] = await db.insert(guestsTable).values(newGuest).returning();
    return guest;
}

export async function getGuestByRankToken(rankToken: string) {
  const [guest] = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.rankToken, rankToken));
  return guest;
}

export async function getGuestsByUserId(userId: string){
  const guests = await db.select().from(guestsTable).where(eq(guestsTable.userId, userId)).orderBy(guestsTable.name);
  return guests;
}

export async function getGuestDishes(userId: string, guestId: string){
  // Use LEFT JOIN so dishes without a rank for this guest still appear with rank = null.
  const rows = await db
    .select({
      id: dishesTable.id, // Changed from dishId to id to match interface expectation
      dishRankId: dishesRankTable.id,
      dishId: dishesTable.id,
      name: dishesTable.name,
      description: dishesTable.description,
      category: dishesTable.category, // Added category as it's needed for grouping
      rank: dishesRankTable.rank,
    })
    .from(dishesTable)
    .leftJoin(
      dishesRankTable,
      and(
        eq(dishesTable.id, dishesRankTable.dishId),
        eq(dishesRankTable.guestId, guestId)
      )
    )
    .where(eq(dishesTable.userId, userId)).orderBy(dishesTable.name);

  return rows;
}


export async function rankDish(guestId: string, dishId: string, rank: number){
  const [rankedDish] = await db.insert(dishesRankTable).values({
    guestId,
    dishId,
    rank
  }).onConflictDoUpdate({
    target: [dishesRankTable.guestId, dishesRankTable.dishId],
    set: { rank, updatedAt: new Date().toISOString() }
  })
  .returning();

  return rankedDish;
}


export async function getGuestUser(guestId: string) {
  const [user] = await db.select({userId: guestsTable.userId}).from(guestsTable).where(eq(guestsTable.id, guestId));
  return user;
}

export async function getDishForUser(dishId: string, userId: string) {
  const [dish] = await db
    .select({ id: dishesTable.id })
    .from(dishesTable)
    .where(and(eq(dishesTable.id, dishId), eq(dishesTable.userId, userId)));
  return dish;
}


export async function updateGuest(guestId: string, newGuestName: string) {
  const [updatedGuest] = await db.update(guestsTable).set({
    name: newGuestName,
  }).where(eq(guestsTable.id, guestId)).returning();
  return updatedGuest;
}

export async function deleteGuest(guestId: string) {
  await db.delete(guestsTable).where(eq(guestsTable.id, guestId));
}
