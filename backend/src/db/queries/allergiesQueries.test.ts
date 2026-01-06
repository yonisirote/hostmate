import { vi } from "vitest";
import { createClient } from "@libsql/client";
import fs from "fs";
import os from "os";
import path from "path";

type AllergiesQueriesModule = typeof import("./allergiesQueries.js");

function iso(date: string) {
  return `${date}T00:00:00.000Z`;
}

describe("allergiesQueries", () => {
  let client: ReturnType<typeof createClient>;
  let dbPath: string;
  let allergiesQueries: AllergiesQueriesModule;

  async function exec(sql: string, args: unknown[] = []) {
    await client.execute(sql, args as never);
  }

  async function assertTableExists(tableName: string) {
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [tableName] as never,
    );
    const names = result.rows.map((row) => row.name);
    expect(names).toContain(tableName);
  }

  async function createSchema() {
    await exec("PRAGMA foreign_keys=ON");

    await exec(
      [
        "CREATE TABLE users (",
        "  id TEXT PRIMARY KEY NOT NULL,",
        "  name TEXT NOT NULL,",
        "  username TEXT NOT NULL,",
        "  hashed_password TEXT NOT NULL,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n"),
    );

    await exec(
      [
        "CREATE TABLE guests (",
        "  id TEXT PRIMARY KEY NOT NULL,",
        "  name TEXT NOT NULL,",
        "  rank_token TEXT,",
        "  user_id TEXT NOT NULL,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n"),
    );

    await exec(
      [
        "CREATE TABLE dishes (",
        "  id TEXT PRIMARY KEY NOT NULL,",
        "  name TEXT NOT NULL,",
        "  description TEXT,",
        "  category TEXT NOT NULL,",
        "  user_id TEXT NOT NULL,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n"),
    );

    await exec(
      [
        "CREATE TABLE meals (",
        "  id TEXT PRIMARY KEY NOT NULL,",
        "  user_id TEXT NOT NULL,",
        "  date TEXT NOT NULL,",
        "  name TEXT NOT NULL,",
        "  description TEXT,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n"),
    );

    await exec(
      [
        "CREATE TABLE meal_guests (",
        "  meal_id TEXT NOT NULL,",
        "  guest_id TEXT NOT NULL,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n"),
    );

    await exec(
      [
        "CREATE TABLE guest_allergies (",
        "  guest_id TEXT NOT NULL,",
        "  allergy TEXT NOT NULL,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n"),
    );

    await exec(
      [
        "CREATE TABLE dish_allergens (",
        "  dish_id TEXT NOT NULL,",
        "  allergy TEXT NOT NULL,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n"),
    );
  }

  async function seedBase() {
    await exec(
      "INSERT INTO users (id, name, username, hashed_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["u1", "User 1", "user1", "hash", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO meals (id, user_id, date, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["m1", "u1", "2025-01-10", "Dinner", "test", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO guests (id, name, rank_token, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["g1", "Guest 1", "t1", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO guests (id, name, rank_token, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["g2", "Guest 2", "t2", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO dishes (id, name, description, category, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["d1", "Dish 1", "", "main", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules();

    dbPath = path.join(
      os.tmpdir(),
      `hostmate_allergies_${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2)}.db`,
    );

    client = createClient({ url: `file:${dbPath}` });

    const { resetTestDbClient } = await import("../dbConfig.js");
    resetTestDbClient(client);

    await createSchema();
    await seedBase();

    await assertTableExists("guest_allergies");
    await assertTableExists("dish_allergens");

    allergiesQueries = await import("./allergiesQueries.js");
  });

  afterEach(() => {
    client?.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {
      // ignore
    }
  });

  test("getGuestAllergies returns empty when none", async () => {
    const allergies = await allergiesQueries.getGuestAllergies("g1");
    expect(allergies).toEqual([]);
  });

  test("setGuestAllergies replaces existing rows", async () => {
    await allergiesQueries.setGuestAllergies("g1", ["dairy"]);
    await allergiesQueries.setGuestAllergies("g1", ["peanuts", "soy"]);

    const allergies = await allergiesQueries.getGuestAllergies("g1");
    expect(allergies.sort()).toEqual(["peanuts", "soy"]);
  });

  test("setGuestAllergies supports empty list (deletes)", async () => {
    await allergiesQueries.setGuestAllergies("g1", ["dairy"]);
    await allergiesQueries.setGuestAllergies("g1", []);

    const allergies = await allergiesQueries.getGuestAllergies("g1");
    expect(allergies).toEqual([]);
  });

  test("setDishAllergens replaces existing rows", async () => {
    await allergiesQueries.setDishAllergens("d1", ["dairy"]);
    await allergiesQueries.setDishAllergens("d1", ["peanuts"]);

    const allergens = await allergiesQueries.getDishAllergens("d1");
    expect(allergens).toEqual(["peanuts"]);
  });

  test("getMealAllergies returns unique allergies across guests", async () => {
    await exec(
      "INSERT INTO meal_guests (meal_id, guest_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["m1", "g1", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO meal_guests (meal_id, guest_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["m1", "g2", iso("2025-01-01"), iso("2025-01-01")],
    );

    await allergiesQueries.setGuestAllergies("g1", ["dairy", "peanuts"]);
    await allergiesQueries.setGuestAllergies("g2", ["dairy"]);

    const mealAllergies = await allergiesQueries.getMealAllergies("m1");
    expect(mealAllergies.sort()).toEqual(["dairy", "peanuts"]);
  });
});
