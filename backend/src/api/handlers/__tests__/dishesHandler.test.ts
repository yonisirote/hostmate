import type { Request, Response } from "express";
import { vi } from "vitest";

type DishesHandlers = typeof import("../dishesHandler.js");

const mockAuthenticateUserId = vi.fn<(req: Request) => string | undefined>();
const mockAddDish = vi.fn();
const mockEditDish = vi.fn();
const mockDeleteDish = vi.fn();

type DishRecord = {
  id: string;
};

const mockGetDishesByUserId = vi.fn<(userId: string) => Promise<DishRecord[]>>();

let handlers: DishesHandlers;

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

  vi.mock("../../../auth.js", () => ({
    authenticateUserId: mockAuthenticateUserId,
  }));

  vi.mock("../../../db/queries/dishQueries.js", () => ({
    addDish: mockAddDish,
    getDishes: vi.fn(),
    getDishesByUserId: mockGetDishesByUserId,
    editDish: mockEditDish,
    deleteDish: mockDeleteDish,
  }));

  handlers = await import("../dishesHandler.js");
});

describe("dishesHandler", () => {
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

  test("addDishHandler throws when category invalid", async () => {
    const req = { body: { name: "Pasta", category: "invalid" } } as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.addDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid dish category.",
    });
    expect(mockAddDish).not.toHaveBeenCalled();
  });

  test("addDishHandler creates dish and responds 200", async () => {
    const req = { body: { name: "Pasta", category: "main", description: "Tasty" } } as Request;
    const { res, status, json } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockAddDish.mockResolvedValue({ id: "dish-1" });

    await handlers.addDishHandler(req, res);

    expect(mockAddDish).toHaveBeenCalledWith({
      name: "Pasta",
      description: "Tasty",
      category: "main",
      userId: "user-1",
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ id: "dish-1" });
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

  test("getDishesByUserHandler returns user dishes", async () => {
    const req = {} as Request;
    const { res, status, json } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockGetDishesByUserId.mockResolvedValue([{ id: "d1" }, { id: "d2" }]);

    await handlers.getDishesByUserHandler(req, res);

    expect(mockGetDishesByUserId).toHaveBeenCalledWith("user-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([{ id: "d1" }, { id: "d2" }]);
  });

  test("editDishHandler throws when category invalid", async () => {
    const req = {
      params: { dishId: "dish-1" },
      body: { name: "Pasta", category: "invalid", description: "Tasty" },
    } as unknown as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.editDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid dish category.",
    });
    expect(mockEditDish).not.toHaveBeenCalled();
  });

  test("editDishHandler calls editDish and responds 200", async () => {
    const req = {
      params: { dishId: "dish-1" },
      body: { name: "Pasta", category: "main", description: "Tasty" },
    } as unknown as Request;
    const { res, status, json } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");
    mockEditDish.mockResolvedValue({ id: "dish-1", name: "Pasta" });

    await handlers.editDishHandler(req, res);

    expect(mockEditDish).toHaveBeenCalledWith("dish-1", "Pasta", "main", "Tasty");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ id: "dish-1", name: "Pasta" });
  });

  test("deleteDishHandler throws when dishId missing", async () => {
    const req = { params: {}, body: {} } as unknown as Request;
    const { res } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    const promise = handlers.deleteDishHandler(req, res);

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing dish information.",
    });
  });

  test("deleteDishHandler deletes dish and responds 200", async () => {
    const req = { params: { dishId: "dish-1" } } as unknown as Request;
    const { res, status, json } = createMockResponse();
    mockAuthenticateUserId.mockReturnValue("user-1");

    await handlers.deleteDishHandler(req, res);

    expect(mockDeleteDish).toHaveBeenCalledWith("dish-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ message: "Dish deleted successfully." });
  });
});
