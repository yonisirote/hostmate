import type { Request, Response } from "express";
import { vi } from "vitest";

type MealsHandlers = typeof import("../mealsHandler.js");

const mockAuthenticateUserId = vi.fn<(req: Request) => string | undefined>();
const mockVerifyResourceOwnership = vi.fn<(resourceUserId: string, authenticatedUserId: string) => void>();

const mockAddMeal = vi.fn();
const mockAddGuestToMeal = vi.fn();
const mockGetMealById = vi.fn<(mealId: string) => Promise<{ id: string; userId: string } | undefined>>();
const mockRemoveGuestFromMeal = vi.fn<(mealId: string, guestId: string) => Promise<unknown[]>>();
const mockGetMealsByUserId = vi.fn<(userId: string) => Promise<unknown[]>>();
const mockGetMealGuests = vi.fn<(mealId: string) => Promise<unknown[]>>();
const mockDeleteMeal = vi.fn<(mealId: string) => Promise<void>>();
const mockEditMeal = vi.fn();
const mockGetMainMealRankings = vi.fn();
const mockGetSideMealRankings = vi.fn();
const mockGetDessertMealRankings = vi.fn();
const mockGetOtherMealRankings = vi.fn();

let handlers: MealsHandlers;


function createMockResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  const res = {
    status,
    json,
  } as unknown as Response;

  return { res, status, json };
}

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();

  vi.doMock("../../../auth.js", () => ({
    authenticateUserId: mockAuthenticateUserId,
    verifyResourceOwnership: mockVerifyResourceOwnership,
  }));

  vi.doMock("../../../db/queries/mealsQueries.js", () => ({
    addMeal: mockAddMeal,
    addGuestToMeal: mockAddGuestToMeal,
    getMealById: mockGetMealById,
    getMealsByUserId: mockGetMealsByUserId,
    getMealGuests: mockGetMealGuests,
    getMainMealRankings: mockGetMainMealRankings,
    getSideMealRankings: mockGetSideMealRankings,
    getDessertMealRankings: mockGetDessertMealRankings,
    getOtherMealRankings: mockGetOtherMealRankings,
    deleteMeal: mockDeleteMeal,
    editMeal: mockEditMeal,
    removeGuestFromMeal: mockRemoveGuestFromMeal,
  }));

  handlers = await import("../mealsHandler.js");
});

describe("mealsHandler error handling", () => {
  test("getMealsByUserHandler throws when user unauthorized", async () => {
    const req = {} as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue(undefined);

    const promise = handlers.getMealsByUserHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  test("getMealsByUserHandler returns meals", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealsByUserId.mockResolvedValue([{ id: "m1" }, { id: "m2" }]);

    const req = {} as Request;
    const { res, status, json } = createMockResponse();

    await handlers.getMealsByUserHandler(req, res);

    expect(mockGetMealsByUserId).toHaveBeenCalledWith("user-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([{ id: "m1" }, { id: "m2" }]);
  });

  test("getMealGuestsHandler throws when mealId missing", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");

    const req = { params: {} } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getMealGuestsHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Error with meal info.",
    });
  });

  test("getMealGuestsHandler throws when meal not found", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealById.mockResolvedValue(undefined);

    const req = { params: { mealId: "meal-1" } } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getMealGuestsHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 404,
      message: "Meal not found.",
    });
  });

  test("getMealGuestsHandler verifies ownership and returns guests", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealById.mockResolvedValue({ id: "meal-1", userId: "user-1" });
    mockGetMealGuests.mockResolvedValue([{ id: "guest-1" }]);

    const req = { params: { mealId: "meal-1" } } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.getMealGuestsHandler(req, res);

    expect(mockVerifyResourceOwnership).toHaveBeenCalledWith("user-1", "user-1");
    expect(mockGetMealGuests).toHaveBeenCalledWith("meal-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([{ id: "guest-1" }]);
  });
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

  test("addGuestToMealHandler throws when guestIds empty", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");

    const req = {
      params: { mealId: "meal-1" },
      body: { guestIds: [] },
    } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.addGuestToMealHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing meal or guest information.",
    });
  });

  test("addGuestToMealHandler throws when meal missing", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealById.mockResolvedValue(undefined);

    const req = {
      params: { mealId: "meal-1" },
      body: { guestIds: ["guest-1"] },
    } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.addGuestToMealHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 404,
      message: "Meal not found.",
    });
  });

  test("addGuestToMealHandler adds each guestId", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealById.mockResolvedValue({ id: "meal-1", userId: "user-1" });
    mockAddGuestToMeal.mockResolvedValueOnce({ mealId: "meal-1", guestId: "guest-1" });
    mockAddGuestToMeal.mockResolvedValueOnce({ mealId: "meal-1", guestId: "guest-2" });

    const req = {
      params: { mealId: "meal-1" },
      body: { guestIds: ["guest-1", "guest-2"] },
    } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.addGuestToMealHandler(req, res);

    expect(mockVerifyResourceOwnership).toHaveBeenCalledWith("user-1", "user-1");
    expect(mockAddGuestToMeal).toHaveBeenCalledTimes(2);
    expect(mockAddGuestToMeal).toHaveBeenNthCalledWith(1, "meal-1", "guest-1");
    expect(mockAddGuestToMeal).toHaveBeenNthCalledWith(2, "meal-1", "guest-2");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([
      { mealId: "meal-1", guestId: "guest-1" },
      { mealId: "meal-1", guestId: "guest-2" },
    ]);
  });

  test("getMenuHandler slices each category", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealById.mockResolvedValue({ id: "meal-1", userId: "user-1" });

    mockGetMainMealRankings.mockResolvedValue([1, 2, 3]);
    mockGetSideMealRankings.mockResolvedValue([1, 2, 3, 4, 5]);
    mockGetDessertMealRankings.mockResolvedValue([1, 2]);
    mockGetOtherMealRankings.mockResolvedValue([1, 2, 3, 4]);

    const req = { params: { mealId: "meal-1" }, query: {} } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.getMenuHandler(req, res);

    expect(mockGetMainMealRankings).toHaveBeenCalledWith("meal-1", false);
    expect(mockGetSideMealRankings).toHaveBeenCalledWith("meal-1", false);
    expect(mockGetDessertMealRankings).toHaveBeenCalledWith("meal-1", false);
    expect(mockGetOtherMealRankings).toHaveBeenCalledWith("meal-1", false);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      main: [1, 2],
      side: [1, 2, 3, 4],
      dessert: [1],
      other: [1, 2, 3],
    });
  });

  test("deleteMealHandler throws when mealId missing", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");

    const req = { params: {} } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.deleteMealHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing meal information.",
    });
  });

  test("deleteMealHandler deletes and responds 200", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealById.mockResolvedValue({ id: "meal-1", userId: "user-1" });

    const req = { params: { mealId: "meal-1" } } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.deleteMealHandler(req, res);

    expect(mockDeleteMeal).toHaveBeenCalledWith("meal-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ message: "Meal deleted successfully." });
  });

  test("editMealHandler throws when fields missing", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");

    const req = {
      params: { mealId: "meal-1" },
      body: { name: "Dinner" },
    } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.editMealHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing meal information.",
    });
  });

  test("editMealHandler edits and responds 200", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetMealById.mockResolvedValue({ id: "meal-1", userId: "user-1" });
    mockEditMeal.mockResolvedValue({ id: "meal-1", name: "Dinner" });

    const req = {
      params: { mealId: "meal-1" },
      body: { date: "2025-01-01", name: "Dinner", description: "nice" },
    } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.editMealHandler(req, res);

    expect(mockEditMeal).toHaveBeenCalledWith("meal-1", "2025-01-01", "Dinner", "nice");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ id: "meal-1", name: "Dinner" });
  });
});
