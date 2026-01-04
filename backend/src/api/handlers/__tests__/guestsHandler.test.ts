import type { Request, Response } from "express";
import { jest } from "@jest/globals";

type GuestsHandlers = typeof import("../guestsHandler.js");

type GuestUserRecord = {
  userId: string;
};

const mockAuthenticateUserId = jest.fn<(req: Request) => string | undefined>();
const mockAddGuest = jest.fn();
const mockGetGuestUser = jest.fn<(guestId: string) => Promise<GuestUserRecord | undefined>>();

let handlers: GuestsHandlers;

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
  }));

  jest.unstable_mockModule("../../../db/queries/guestQueries.js", () => ({
    addGuest: mockAddGuest,
    deleteGuest: jest.fn(),
    getDishForUser: jest.fn(),
    getGuestByRankToken: jest.fn(),
    getGuestDishes: jest.fn(),
    getGuests: jest.fn(),
    getGuestsByUserId: jest.fn(),
    getGuestUser: mockGetGuestUser,
    rankDish: jest.fn(),
    updateGuest: jest.fn(),
  }));

  jest.unstable_mockModule("../../../db/queries/userQueries.js", () => ({
    getUserNameById: jest.fn(),
  }));

  handlers = await import("../guestsHandler.js");
});

describe("guestsHandler error handling", () => {
  test("addGuestHandler throws HttpError when user unauthorized", async () => {
    const req = { body: { name: "Alice" } } as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue(undefined);

    const promise = handlers.addGuestHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  test("addGuestHandler throws when name missing", async () => {
    const req = { body: {} } as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.addGuestHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing guest information.",
    });
  });

  test("rankDishHandler throws when rank invalid", async () => {
    const req = {
      params: { guestId: "guest-1", dishId: "dish-1" },
      body: { rank: 5 },
    } as unknown as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.rankDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "rank must be between 1 and 3",
    });
  });

  test("rankDishHandler throws when guest not owned by user", async () => {
    const req = {
      params: { guestId: "guest-1", dishId: "dish-1" },
      body: { rank: 2 },
    } as unknown as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue({ userId: "other-user" });

    const promise = handlers.rankDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 403,
      message: "Forbidden",
    });
  });
});
