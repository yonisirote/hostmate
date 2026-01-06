import type { Request, Response } from "express";
import { jest } from "@jest/globals";

type GuestsHandlers = typeof import("../guestsHandler.js");

type GuestUserRecord = {
  userId: string;
};

type GuestRankTokenRecord = {
  id: string;
  userId: string;
};

const mockAuthenticateUserId = jest.fn<(req: Request) => string | undefined>();
const mockAddGuest = jest.fn();
const mockGetGuestUser = jest.fn<(guestId: string) => Promise<GuestUserRecord | undefined>>();
const mockGetGuestsByUserId = jest.fn<(userId: string) => Promise<unknown[]>>();
const mockGetGuestDishes = jest.fn<(userId: string, guestId: string) => Promise<unknown[]>>();
const mockGetGuestByRankToken = jest.fn<(rankToken: string) => Promise<GuestRankTokenRecord | undefined>>();
const mockGetUserNameById = jest.fn<(userId: string) => Promise<string | undefined>>();
const mockGetDishForUser = jest.fn<(dishId: string, userId: string) => Promise<unknown | undefined>>();
const mockDeleteGuest = jest.fn<(guestId: string) => Promise<void>>();
const mockUpdateGuest = jest.fn<(guestId: string, newName: string) => Promise<unknown>>();
const mockRankDish = jest.fn();

let handlers: GuestsHandlers;

function createMockResponse() {
  const json = jest.fn();
  const send = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnThis();
  const res = {
    status,
    json,
    send,
  } as unknown as Response;

  return { res, status, json, send };
}

beforeEach(async () => {
  jest.resetAllMocks();
  jest.resetModules();

  jest.unstable_mockModule("../../../auth.js", () => ({
    authenticateUserId: mockAuthenticateUserId,
  }));

  jest.unstable_mockModule("../../../db/queries/guestQueries.js", () => ({
    addGuest: mockAddGuest,
    deleteGuest: mockDeleteGuest,
    getDishForUser: mockGetDishForUser,
    getGuestByRankToken: mockGetGuestByRankToken,
    getGuestDishes: mockGetGuestDishes,
    getGuests: jest.fn(),
    getGuestsByUserId: mockGetGuestsByUserId,
    getGuestUser: mockGetGuestUser,
    rankDish: mockRankDish,
    updateGuest: mockUpdateGuest,
  }));

  jest.unstable_mockModule("../../../db/queries/userQueries.js", () => ({
    getUserNameById: mockGetUserNameById,
  }));

  handlers = await import("../guestsHandler.js");
});

describe("guestsHandler", () => {
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

  test("addGuestHandler creates guest and responds 200", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockAddGuest.mockResolvedValue({ id: "guest-1", name: "Alice" });

    const req = { body: { name: "Alice" } } as Request;
    const { res, status, json } = createMockResponse();

    await handlers.addGuestHandler(req, res);

    expect(mockAddGuest).toHaveBeenCalledWith({ name: "Alice", userId: "user-1" });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ id: "guest-1", name: "Alice" });
  });

  test("rankDishHandler throws when rank missing", async () => {
    const req = {
      params: { guestId: "guest-1", dishId: "dish-1" },
      body: {},
    } as unknown as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.rankDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Error with dish rank info.",
    });
  });

  test("rankDishHandler throws when rank not numeric", async () => {
    const req = {
      params: { guestId: "guest-1", dishId: "dish-1" },
      body: { rank: "abc" },
    } as unknown as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.rankDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid rank value",
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

  test("rankDishHandler ranks dish and responds 200", async () => {
    mockRankDish.mockResolvedValue({ guestId: "guest-1", dishId: "dish-1", rank: 3 });

    const req = {
      params: { guestId: "guest-1", dishId: "dish-1" },
      body: { rank: 3 },
    } as unknown as Request;
    const { res, status, json } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue({ userId: "user-1" });

    await handlers.rankDishHandler(req, res);

    expect(mockRankDish).toHaveBeenCalledWith("guest-1", "dish-1", 3);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ guestId: "guest-1", dishId: "dish-1", rank: 3 });
  });

  test("getGuestsByUserHandler returns guests", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestsByUserId.mockResolvedValue([{ id: "g1" }, { id: "g2" }]);

    const req = {} as Request;
    const { res, status, json } = createMockResponse();

    await handlers.getGuestsByUserHandler(req, res);

    expect(mockGetGuestsByUserId).toHaveBeenCalledWith("user-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([{ id: "g1" }, { id: "g2" }]);
  });

  test("getGuestByRankTokenHandler throws when rank token missing", async () => {
    const req = { params: {} } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getGuestByRankTokenHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing rank token",
    });
  });

  test("getGuestByRankTokenHandler throws when guest not found", async () => {
    mockGetGuestByRankToken.mockResolvedValue(undefined);

    const req = { params: { rankToken: "token-1" } } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.getGuestByRankTokenHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 404,
      message: "Guest not found",
    });
  });

  test("getGuestByRankTokenHandler returns guest, dishes and hostName", async () => {
    mockGetGuestByRankToken.mockResolvedValue({ id: "guest-1", userId: "user-1" });
    mockGetUserNameById.mockResolvedValue("Host");
    mockGetGuestDishes.mockResolvedValue([{ id: "dish-1" }]);

    const req = { params: { rankToken: "token-1" } } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.getGuestByRankTokenHandler(req, res);

    expect(mockGetUserNameById).toHaveBeenCalledWith("user-1");
    expect(mockGetGuestDishes).toHaveBeenCalledWith("user-1", "guest-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      guest: { id: "guest-1", userId: "user-1" },
      dishes: [{ id: "dish-1" }],
      hostName: "Host",
    });
  });

  test("rankDishByRankTokenHandler throws when rank token missing", async () => {
    const req = {
      params: { dishId: "dish-1" },
      body: { rank: 1 },
    } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.rankDishByRankTokenHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing rank token or dish information",
    });
  });

  test("rankDishByRankTokenHandler throws when dish not owned", async () => {
    mockGetGuestByRankToken.mockResolvedValue({ id: "guest-1", userId: "user-1" });
    mockGetDishForUser.mockResolvedValue(undefined);

    const req = {
      params: { rankToken: "token-1", dishId: "dish-1" },
      body: { rank: 2 },
    } as unknown as Request;
    const { res } = createMockResponse();

    const promise = handlers.rankDishByRankTokenHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 404,
      message: "Dish not found",
    });
  });

  test("rankDishByRankTokenHandler ranks dish", async () => {
    mockGetGuestByRankToken.mockResolvedValue({ id: "guest-1", userId: "user-1" });
    mockGetDishForUser.mockResolvedValue({ id: "dish-1" });
    mockRankDish.mockResolvedValue({ guestId: "guest-1", dishId: "dish-1", rank: 2 });

    const req = {
      params: { rankToken: "token-1", dishId: "dish-1" },
      body: { rank: 2 },
    } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.rankDishByRankTokenHandler(req, res);

    expect(mockRankDish).toHaveBeenCalledWith("guest-1", "dish-1", 2);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ guestId: "guest-1", dishId: "dish-1", rank: 2 });
  });

  test("updateGuestHandler updates guest", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue({ userId: "user-1" });
    mockUpdateGuest.mockResolvedValue({ id: "guest-1", name: "New" });

    const req = {
      params: { guestId: "guest-1" },
      body: { name: "New" },
    } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.updateGuestHandler(req, res);

    expect(mockUpdateGuest).toHaveBeenCalledWith("guest-1", "New");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ id: "guest-1", name: "New" });
  });

  test("deleteGuestHandler deletes and responds 204", async () => {
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetGuestUser.mockResolvedValue({ userId: "user-1" });

    const req = {
      params: { guestId: "guest-1" },
    } as unknown as Request;
    const { res, status } = createMockResponse();

    await handlers.deleteGuestHandler(req, res);

    expect(mockDeleteGuest).toHaveBeenCalledWith("guest-1");
    expect(status).toHaveBeenCalledWith(204);
  });
});
