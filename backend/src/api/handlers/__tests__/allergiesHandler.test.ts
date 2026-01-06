import type { Request, Response } from "express";
import { jest } from "@jest/globals";

type AllergiesHandlers = typeof import("../allergiesHandler.js");

const mockAuthenticateUserId = jest.fn<(req: Request) => string | undefined>();
const mockVerifyResourceOwnership = jest.fn<(resourceUserId: string, authenticatedUserId: string) => void>();

const mockGetGuestUser = jest.fn();
const mockGetDishById = jest.fn();

const mockGetGuestAllergies = jest.fn();
const mockSetGuestAllergies = jest.fn();
const mockGetDishAllergens = jest.fn();
const mockSetDishAllergens = jest.fn();

let handlers: AllergiesHandlers;

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
    verifyResourceOwnership: mockVerifyResourceOwnership,
  }));

  jest.unstable_mockModule("../../../db/queries/guestQueries.js", () => ({
    getGuestUser: mockGetGuestUser,
  }));

  jest.unstable_mockModule("../../../db/queries/dishQueries.js", () => ({
    getDishById: mockGetDishById,
  }));

  jest.unstable_mockModule("../../../db/queries/allergiesQueries.js", () => ({
    getGuestAllergies: mockGetGuestAllergies,
    setGuestAllergies: mockSetGuestAllergies,
    getDishAllergens: mockGetDishAllergens,
    setDishAllergens: mockSetDishAllergens,
  }));

  handlers = await import("../allergiesHandler.js");
});

describe("allergiesHandler", () => {
  test("getAllergiesListHandler returns ALLERGIES list", async () => {
    const req = {} as Request;
    const { res, status, json } = createMockResponse();

    await handlers.getAllergiesListHandler(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.arrayContaining(["peanuts"]));
  });

  test("getGuestAllergiesHandler throws when unauthorized", async () => {
    mockAuthenticateUserId.mockReturnValue(undefined);

    const req = { params: { guestId: "guest-1" } } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getGuestAllergiesHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  test("getGuestAllergiesHandler throws when guestId missing", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");

    const req = { params: {} } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getGuestAllergiesHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing guest information.",
    });
  });

  test("getGuestAllergiesHandler throws when guest not found", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue(undefined);

    const req = { params: { guestId: "guest-1" } } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getGuestAllergiesHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 404,
      message: "Guest not found.",
    });
    expect(mockVerifyResourceOwnership).not.toHaveBeenCalled();
  });

  test("getGuestAllergiesHandler verifies ownership and returns allergies", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue({ userId: "user-1" });
    mockGetGuestAllergies.mockResolvedValue(["peanuts"]);

    const req = { params: { guestId: "guest-1" } } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.getGuestAllergiesHandler(req, res);

    expect(mockVerifyResourceOwnership).toHaveBeenCalledWith("user-1", "user-1");
    expect(mockGetGuestAllergies).toHaveBeenCalledWith("guest-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(["peanuts"]);
  });

  test("setGuestAllergiesHandler throws when allergies is not array", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue({ userId: "user-1" });

    const req = {
      params: { guestId: "guest-1" },
      body: { allergies: "peanuts" },
    } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.setGuestAllergiesHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "allergies must be an array",
    });
    expect(mockSetGuestAllergies).not.toHaveBeenCalled();
  });

  test("setGuestAllergiesHandler throws when allergy invalid", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue({ userId: "user-1" });

    const req = {
      params: { guestId: "guest-1" },
      body: { allergies: ["not-real"] },
    } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.setGuestAllergiesHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid allergy: not-real",
    });
    expect(mockSetGuestAllergies).not.toHaveBeenCalled();
  });

  test("setGuestAllergiesHandler normalizes, de-dupes and persists", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue({ userId: "user-1" });

    const req = {
      params: { guestId: "guest-1" },
      body: { allergies: [" peanuts ", "peanuts", "", 123] },
    } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.setGuestAllergiesHandler(req, res);

    expect(mockSetGuestAllergies).toHaveBeenCalledWith("guest-1", ["peanuts"]);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(["peanuts"]);
  });

  test("getDishAllergensHandler throws when dishId missing", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");

    const req = { params: {} } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getDishAllergensHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing dish information.",
    });
  });

  test("getDishAllergensHandler throws when dish not found", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetDishById.mockResolvedValue(undefined);

    const req = { params: { dishId: "dish-1" } } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getDishAllergensHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 404,
      message: "Dish not found.",
    });
  });

  test("setDishAllergensHandler persists and returns parsed list", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetDishById.mockResolvedValue({ id: "dish-1", userId: "user-1" });

    const req = {
      params: { dishId: "dish-1" },
      body: { allergies: ["peanuts"] },
    } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.setDishAllergensHandler(req, res);

    expect(mockVerifyResourceOwnership).toHaveBeenCalledWith("user-1", "user-1");
    expect(mockSetDishAllergens).toHaveBeenCalledWith("dish-1", ["peanuts"]);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(["peanuts"]);
  });
});
