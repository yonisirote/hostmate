import type { Request, Response } from "express";

import { authenticateUserId, verifyResourceOwnership } from "../../auth.js";
import { HttpError } from "../errors.js";
import { ALLERGIES, type Allergy } from "../../db/schema.js";
import { getDishAllergens, getGuestAllergies, setDishAllergens, setGuestAllergies } from "../../db/queries/allergiesQueries.js";
import { getDishById } from "../../db/queries/dishQueries.js";
import { getGuestUser } from "../../db/queries/guestQueries.js";

export async function getAllergiesListHandler(_: Request, res: Response) {
  res.status(200).json(ALLERGIES);
}

function parseAllergies(input: unknown): Allergy[] {
  if (!Array.isArray(input)) {
    throw new HttpError(400, "allergies must be an array");
  }

  const allergies = input
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean) as Allergy[];

  for (const allergy of allergies) {
    if (!ALLERGIES.includes(allergy)) {
      throw new HttpError(400, `Invalid allergy: ${allergy}`);
    }
  }

  return Array.from(new Set(allergies));
}

export async function getGuestAllergiesHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const guestId = req.params.guestId;
  if (!guestId) {
    throw new HttpError(400, "Missing guest information.");
  }

  const guestUser = await getGuestUser(guestId);
  if (!guestUser) {
    throw new HttpError(404, "Guest not found.");
  }
  verifyResourceOwnership(guestUser.userId, userId);

  const allergies = await getGuestAllergies(guestId);
  res.status(200).json(allergies);
}

export async function setGuestAllergiesHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const guestId = req.params.guestId;
  if (!guestId) {
    throw new HttpError(400, "Missing guest information.");
  }

  const guestUser = await getGuestUser(guestId);
  if (!guestUser) {
    throw new HttpError(404, "Guest not found.");
  }
  verifyResourceOwnership(guestUser.userId, userId);

  const allergies = parseAllergies(req.body?.allergies);
  await setGuestAllergies(guestId, allergies);

  res.status(200).json(allergies);
}

export async function getDishAllergensHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const dishId = req.params.dishId;
  if (!dishId) {
    throw new HttpError(400, "Missing dish information.");
  }

  const dish = await getDishById(dishId);
  if (!dish) {
    throw new HttpError(404, "Dish not found.");
  }
  verifyResourceOwnership(dish.userId, userId);

  const allergens = await getDishAllergens(dishId);
  res.status(200).json(allergens);
}

export async function setDishAllergensHandler(req: Request, res: Response) {
  const userId = authenticateUserId(req);
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const dishId = req.params.dishId;
  if (!dishId) {
    throw new HttpError(400, "Missing dish information.");
  }

  const dish = await getDishById(dishId);
  if (!dish) {
    throw new HttpError(404, "Dish not found.");
  }
  verifyResourceOwnership(dish.userId, userId);

  const allergies = parseAllergies(req.body?.allergies);
  await setDishAllergens(dishId, allergies);

  res.status(200).json(allergies);
}
