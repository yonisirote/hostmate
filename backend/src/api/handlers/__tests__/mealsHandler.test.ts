import type { Request, Response } from "express";
import { jest } from "@jest/globals";

type MealsHandlers = typeof import("../mealsHandler.js");

const mockAuthenticateUserId = jest.fn<(req: Request) => string | undefined>();

const mockAddMeal = jest.fn();
const mockAddGuestToMeal = jest.fn();
const mockGetMealById = jest.fn<(mealId: string) => Promise<{ id: string; userId: string } | undefined>>();
const mockRemoveGuestFromMeal = jest.fn<(mealId: string, guestId: string) => Promise<unknown[]>>();

let handlers: MealsHandlers;


function createMockResponse() {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  const res = {
    status,
    json,
  } as unknown as Response;

  return { res, status, json };
}

beforeEach(async () => {
  jest.resetAllMocks();
  jest.resetModules();

  jest.unstable_mockModule("../../../auth.js", () => ({
    authenticateUserId: mockAuthenticateUserId,
    verifyResourceOwnership: jest.fn(),
  }));

  jest.unstable_mockModule("../../../db/queries/mealsQueries.js", () => ({
    addMeal: mockAddMeal,
    addGuestToMeal: mockAddGuestToMeal,
    getMealById: mockGetMealById,
    getMealsByUserId: jest.fn(),
    getMealGuests: jest.fn(),
    getMainMealRankings: jest.fn(),
    getSideMealRankings: jest.fn(),
    getDessertMealRankings: jest.fn(),
    getOtherMealRankings: jest.fn(),
    deleteMeal: jest.fn(),
    editMeal: jest.fn(),
    removeGuestFromMeal: mockRemoveGuestFromMeal,
  }));

  handlers = await import("../mealsHandler.js");
});

describe("mealsHandler error handling", () => {
  test("addMealHandler throws when user unauthorized", async () => {
    const req = { body: { date: "2025-01-01", name: "Dinner" } } as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue(undefined);

    const promise = handlers.addMealHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  test("addMealHandler throws when required fields missing", async () => {
    const req = { body: { description: "Fancy dinner" } } as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.addMealHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing meal information.",
    });
  });

  test("removeGuestFromMealHandler throws when params missing", async () => {
    const req = { params: { mealId: undefined, guestId: undefined } } as unknown as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.removeGuestFromMealHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing meal or guest information.",
    });
  });

  test("removeGuestFromMealHandler throws when guest not found", async () => {
    const req = { params: { mealId: "meal-1", guestId: "guest-1" } } as unknown as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealById.mockResolvedValue({ id: "meal-1", userId: "user-1" });
    mockRemoveGuestFromMeal.mockResolvedValue([]);

    const promise = handlers.removeGuestFromMealHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 404,
      message: "Guest not found for this meal.",
    });
  });
});
