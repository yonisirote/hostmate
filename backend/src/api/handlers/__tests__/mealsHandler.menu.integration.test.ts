import type { Request } from "express";
import { jest } from "@jest/globals";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import type { Response } from "express";

type MealsHandlers = typeof import("../mealsHandler.js");

type MockResponse = {
  res: Response;
  status: jest.Mock;
  json: jest.Mock;
};

function createMockResponse(): MockResponse {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  const res = {
    status,
    json,
  } as unknown as Response;

  return { res, status, json };
}

function iso(date: string) {
  return `${date}T00:00:00.000Z`;
}

describe("mealsHandler getMenuHandler integration (allergy filtering)", () => {
  let client: ReturnType<typeof createClient>;
  let handlers: MealsHandlers;

  async function exec(sql: string, args: unknown[] = []) {
    await client.execute(sql, args as never);
  }

  async function createSchemaAndSeed() {
    await exec("PRAGMA foreign_keys=ON");

    await exec(
      "CREATE TABLE users (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, username TEXT NOT NULL, hashed_password TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await exec(
      "CREATE TABLE guests (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, rank_token TEXT, user_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await exec(
      "CREATE TABLE dishes (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, description TEXT, category TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await exec(
      "CREATE TABLE meals_table (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, date TEXT NOT NULL, name TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await exec(
      "CREATE TABLE meals (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, date TEXT NOT NULL, name TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await exec(
      "CREATE TABLE meal_guests (meal_id TEXT NOT NULL, guest_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await exec(
      "CREATE TABLE dishes_rank (id TEXT PRIMARY KEY NOT NULL, guest_id TEXT NOT NULL, dish_id TEXT NOT NULL, rank INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await exec(
      "CREATE TABLE guest_allergies (guest_id TEXT NOT NULL, allergy TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await exec(
      "CREATE TABLE dish_allergens (dish_id TEXT NOT NULL, allergy TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );

    await exec(
      "INSERT INTO users (id, name, username, hashed_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["u1", "User 1", "user1", "hash", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO meals_table (id, user_id, date, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        "m1",
        "u1",
        "2025-01-10",
        "Dinner",
        "test",
        iso("2025-01-01"),
        iso("2025-01-01"),
      ],
    );
    await exec(
      "INSERT INTO meals (id, user_id, date, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        "m1",
        "u1",
        "2025-01-10",
        "Dinner",
        "test",
        iso("2025-01-01"),
        iso("2025-01-01"),
      ],
    );

    await exec(
      "INSERT INTO guests (id, name, rank_token, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["g1", "Guest 1", "t1", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO meal_guests (meal_id, guest_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["m1", "g1", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO dishes (id, name, description, category, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["d_safe", "Safe Main", "", "main", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO dishes (id, name, description, category, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["d_dairy", "Dairy Main", "", "main", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO dishes_rank (id, guest_id, dish_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["r1", "g1", "d_safe", 1, iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO dishes_rank (id, guest_id, dish_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["r2", "g1", "d_dairy", 2, iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO guest_allergies (guest_id, allergy, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["g1", "dairy", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO dish_allergens (dish_id, allergy, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["d_dairy", "dairy", iso("2025-01-01"), iso("2025-01-01")],
    );
  }

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.resetModules();

    client = createClient({ url: ":memory:" });
    const testDb = drizzle(client);

    await createSchemaAndSeed();

    jest.unstable_mockModule("../../../auth.js", () => ({
      authenticateUserId: jest.fn(() => "u1"),
      verifyResourceOwnership: jest.fn(),
    }));

    jest.unstable_mockModule("../../../db/dbConfig.js", () => ({
      db: testDb,
    }));

    handlers = await import("../mealsHandler.js");
  });

  afterEach(() => {
    client.close();
  });

  test("default menu excludes unsafe dishes", async () => {
    const req = {
      params: { mealId: "m1" },
      query: {},
    } as unknown as Request;

    const { res, json, status } = createMockResponse();

    await handlers.getMenuHandler(req, res);

    expect(status).toHaveBeenCalledWith(200);

    const payload = json.mock.calls[0]?.[0] as {
      main: Array<{ dishId: string }>;
    };

    expect(payload.main.map((d) => d.dishId)).toEqual(["d_safe"]);
  });

  test("includeUnsafe=true includes unsafe dishes", async () => {
    const req = {
      params: { mealId: "m1" },
      query: { includeUnsafe: "true" },
    } as unknown as Request;

    const { res, json } = createMockResponse();

    await handlers.getMenuHandler(req, res);

    const payload = json.mock.calls[0]?.[0] as {
      main: Array<{ dishId: string; conflictingAllergies?: string[] }>;
    };

    expect(payload.main.map((d) => d.dishId).sort()).toEqual(["d_dairy", "d_safe"]);

    const dairyDish = payload.main.find((d) => d.dishId === "d_dairy");
    expect(dairyDish?.conflictingAllergies).toEqual(["dairy"]);
  });
});
