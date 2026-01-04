import type { Request, Response } from "express";
import { HttpError } from "../errors.js";
import { authenticateUserId, verifyResourceOwnership } from "../../auth.js";
import { addGuestToMeal, addMeal, deleteMeal, editMeal, getDessertMealRankings, getMainMealRankings, getMealGuests, getMealsByUserId, getOtherMealRankings, getSideMealRankings, removeGuestFromMeal, getMealById } from "../../db/queries/mealsQueries.js";


export async function getMealsByUserHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const meals = await getMealsByUserId(userId);
  res.status(200).json(meals);
}

export async function getMealGuestsHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const mealId = req.params.mealId;
  if (!mealId) {
    throw new HttpError(400, "Error with meal info.");
  }
  
  const meal = await getMealById(mealId);
  if (!meal) {
    throw new HttpError(404, "Meal not found.");
  }
  verifyResourceOwnership(meal.userId, userId);
  
  const guests = await getMealGuests(mealId);
  res.status(200).json(guests);
}


export async function addMealHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const { date, name, description } = req.body;
  if (!date || !name) {
    throw new HttpError(400, "Missing meal information.");
  }

  const meal = await addMeal({
    date,
    name,
    description,
    userId
  });

  res.status(200).json(meal);
}


export async function addGuestToMealHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }
  const mealId = req.params.mealId;
  const { guestIds } = req.body;
  if (!mealId || !guestIds || guestIds.length === 0) {
    throw new HttpError(400, "Missing meal or guest information.");
  }

  const meal = await getMealById(mealId);
  if (!meal) {
    throw new HttpError(404, "Meal not found.");
  }
  verifyResourceOwnership(meal.userId, userId);

  const result = [];
  for (const guestId of guestIds) {
    const mealGuest = await addGuestToMeal(mealId, guestId);
    result.push(mealGuest);
  }

  res.status(200).json(result);
} 

export async function removeGuestFromMealHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const { mealId, guestId } = req.params;
  if (!mealId || !guestId) {
    throw new HttpError(400, "Missing meal or guest information.");
  }

  const meal = await getMealById(mealId);
  if (!meal) {
    throw new HttpError(404, "Meal not found.");
  }
  verifyResourceOwnership(meal.userId, userId);

  const result = await removeGuestFromMeal(mealId, guestId);
  if (!result || result.length === 0) {
    throw new HttpError(404, "Guest not found for this meal.");
  }

  res.status(200).json(result[0]);
}

export async function getMenuHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const mealId = req.params.mealId;
  if (!mealId) {
    throw new HttpError(400, "Error with meal info.");
  }
  
  const meal = await getMealById(mealId);
  if (!meal) {
    throw new HttpError(404, "Meal not found.");
  }
  verifyResourceOwnership(meal.userId, userId);
  
  const includeUnsafe = req.query.includeUnsafe === "true";

  const mainDishes = await getMainMealRankings(mealId, includeUnsafe);
  const sideDishes = await getSideMealRankings(mealId, includeUnsafe);
  const dessertDishes = await getDessertMealRankings(mealId, includeUnsafe);
  const otherDishes = await getOtherMealRankings(mealId, includeUnsafe);

  res.status(200).json({
    main: mainDishes.slice(0, 2),
    side: sideDishes.slice(0, 4),
    dessert: dessertDishes.slice(0, 1),
    other: otherDishes.slice(0, 3)
  });
}

export async function deleteMealHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const mealId = req.params.mealId;
  if (!mealId) {
    throw new HttpError(400, "Missing meal information.");
  }

  const meal = await getMealById(mealId);
  if (!meal) {
    throw new HttpError(404, "Meal not found.");
  }
  verifyResourceOwnership(meal.userId, userId);

  await deleteMeal(mealId);

  res.status(200).json({ message: "Meal deleted successfully." });
}

export async function editMealHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const mealId = req.params.mealId;
  const { date, name, description } = req.body;
  if (!mealId || !date || !name) {
    throw new HttpError(400, "Missing meal information.");
  }

  const meal = await getMealById(mealId);
  if (!meal) {
    throw new HttpError(404, "Meal not found.");
  }
  verifyResourceOwnership(meal.userId, userId);

  const result = await editMeal(mealId, date, name, description);
  res.status(200).json(result);
}