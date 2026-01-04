import { db } from "../dbConfig.js";
import { eq } from "drizzle-orm";
import { dishesTable, type Dish } from "../schema.js";

export async function getDishes(){
    const guests = await db.select().from(dishesTable);
    return guests;
}


export async function addDish(newDish: Dish){
    const [dish] = await db.insert(dishesTable).values(newDish).returning();
    return dish;
}

export async function getDishesByUserId(userId: string){
  const dishes = await db.select().from(dishesTable).where(eq(dishesTable.userId, userId)).orderBy(dishesTable.name);
  return dishes;
}

export async function getDishById(dishId: string) {
  const [dish] = await db.select().from(dishesTable).where(eq(dishesTable.id, dishId));
  return dish;
}

export async function editDish(dishId: string, dishName: string, dishCategory: Dish["category"], dishDescription?: string){
  const [updatedDish] = await db.update(dishesTable).set({
    name: dishName,
    description: dishDescription,
    category: dishCategory
  }).where(eq(dishesTable.id, dishId)).returning();
  return updatedDish;
}

export async function deleteDish(dishId: string){
  await db.delete(dishesTable).where(eq(dishesTable.id, dishId));
}