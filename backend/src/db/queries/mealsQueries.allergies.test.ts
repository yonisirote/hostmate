import { jest } from "@jest/globals";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

function iso(date: string) {
  return `${date}T00:00:00.000Z`;
}

type MealsQueriesModule = typeof import("./mealsQueries.js");

describe("mealsQueries allergy filtering", () => {
  let client: ReturnType<typeof createClient>;
  let mealsQueries: MealsQueriesModule;

  async function exec(sql: string, args: unknown[] = []) {
    await client.execute(sql, args as never);
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
        "CREATE TABLE meals_table (",
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
        "CREATE TABLE dishes_rank (",
        "  id TEXT PRIMARY KEY NOT NULL,",
        "  guest_id TEXT NOT NULL,",
        "  dish_id TEXT NOT NULL,",
        "  rank INTEGER NOT NULL,",
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
      "INSERT INTO guests (id, name, rank_token, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["g1", "Guest 1", "t1", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO guests (id, name, rank_token, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["g2", "Guest 2", "t2", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO meal_guests (meal_id, guest_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["m1", "g1", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO meal_guests (meal_id, guest_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["m1", "g2", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO dishes (id, name, description, category, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        "d_safe",
        "Safe Main",
        "",
        "main",
        "u1",
        iso("2025-01-01"),
        iso("2025-01-01"),
      ],
    );
    await exec(
      "INSERT INTO dishes (id, name, description, category, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        "d_dairy",
        "Dairy Main",
        "",
        "main",
        "u1",
        iso("2025-01-01"),
        iso("2025-01-01"),
      ],
    );

    // ranks so both dishes would be candidates
    await exec(
      "INSERT INTO dishes_rank (id, guest_id, dish_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["r1", "g1", "d_safe", 5, iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO dishes_rank (id, guest_id, dish_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["r2", "g2", "d_safe", 4, iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO dishes_rank (id, guest_id, dish_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["r3", "g1", "d_dairy", 1, iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO dishes_rank (id, guest_id, dish_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["r4", "g2", "d_dairy", 5, iso("2025-01-01"), iso("2025-01-01")],
    );

    // guest g1 is allergic to dairy; dish d_dairy contains dairy
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

    await createSchema();
    await seedBase();

    jest.unstable_mockModule("../dbConfig.js", () => ({
      db: testDb,
    }));

    mealsQueries = await import("./mealsQueries.js");
  });

  afterEach(() => {
    client.close();
  });

  test("includeUnsafe=false excludes dishes with any invited guest allergy conflict", async () => {
    const rows = await mealsQueries.getMainMealRankings("m1", false);

    expect(rows.map((r) => r.dishId)).toEqual(["d_safe"]);
    expect(rows[0]?.conflictingAllergies).toEqual([]);
  });

  test("includeUnsafe=true includes unsafe dishes and returns conflictingAllergies", async () => {
    const rows = await mealsQueries.getMainMealRankings("m1", true);

    const dairyDish = rows.find((r) => r.dishId === "d_dairy");
    expect(dairyDish).toBeTruthy();
    expect(dairyDish?.conflictingAllergies).toEqual(["dairy"]);

    const safeDish = rows.find((r) => r.dishId === "d_safe");
    expect(safeDish?.conflictingAllergies).toEqual([]);
  });

  test("filters are meal-scoped: allergy on non-invited guest does not exclude", async () => {
    await exec(
      "INSERT INTO guests (id, name, rank_token, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["g3", "Guest 3", "t3", "u1", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO guest_allergies (guest_id, allergy, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["g3", "gluten", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO dish_allergens (dish_id, allergy, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["d_safe", "gluten", iso("2025-01-01"), iso("2025-01-01")],
    );

    const rows = await mealsQueries.getMainMealRankings("m1", false);
    expect(rows.map((r) => r.dishId)).toEqual(["d_safe"]);
  });

  test("handles multiple guests and multiple allergens for one dish", async () => {
    await exec(
      "INSERT INTO guest_allergies (guest_id, allergy, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["g2", "eggs", iso("2025-01-01"), iso("2025-01-01")],
    );
    await exec(
      "INSERT INTO dish_allergens (dish_id, allergy, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["d_dairy", "eggs", iso("2025-01-01"), iso("2025-01-01")],
    );

    const rows = await mealsQueries.getMainMealRankings("m1", true);
    const dairyDish = rows.find((r) => r.dishId === "d_dairy");

    expect(dairyDish?.conflictingAllergies?.sort()).toEqual(["dairy", "eggs"]);
  });

  test("category filter works: only returns main dishes", async () => {
    await exec(
      "INSERT INTO dishes (id, name, description, category, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        "d_side",
        "Side Dish",
        "",
        "side",
        "u1",
        iso("2025-01-01"),
        iso("2025-01-01"),
      ],
    );
    await exec(
      "INSERT INTO dishes_rank (id, guest_id, dish_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["r5", "g1", "d_side", 5, iso("2025-01-01"), iso("2025-01-01")],
    );

    const rows = await mealsQueries.getMainMealRankings("m1", true);
    expect(rows.map((r) => r.dishId)).not.toContain("d_side");
  });
});
