import type { Request, Response } from "express";
import { jest } from "@jest/globals";

type DishesHandlers = typeof import("../dishesHandler.js");

const mockAuthenticateUserId = jest.fn<(req: Request) => string | undefined>();
const mockAddDish = jest.fn();

type DishRecord = {
  id: string;
};

const mockGetDishesByUserId = jest.fn<(userId: string) => Promise<DishRecord[]>>();

let handlers: DishesHandlers;

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

  jest.unstable_mockModule("../../../db/queries/dishQueries.js", () => ({
    addDish: mockAddDish,
    getDishes: jest.fn(),
    getDishesByUserId: mockGetDishesByUserId,
    editDish: jest.fn(),
    deleteDish: jest.fn(),
  }));

  handlers = await import("../dishesHandler.js");
});

describe("dishesHandler error handling", () => {
  test("addDishHandler throws when user unauthorized", async () => {
    const req = { body: { name: "Pasta", category: "main" } } as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue(undefined);

    const promise = handlers.addDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  test("addDishHandler throws when required fields missing", async () => {
    const req = { body: { description: "Tasty" } } as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.addDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing dish information.",
    });
  });

  test("getDishesByUserHandler throws when user unauthorized", async () => {
    const req = {} as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue(undefined);

    const promise = handlers.getDishesByUserHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });
});
