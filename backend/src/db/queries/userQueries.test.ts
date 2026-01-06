import { jest } from "@jest/globals";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

type UserQueriesModule = typeof import("./userQueries.js");

type UserRow = {
  id: string;
  name: string;
  username: string;
  hashedPassword: string;
  createdAt: string;
  updatedAt: string;
};

function iso(date: string) {
  return `${date}T00:00:00.000Z`;
}

describe("userQueries", () => {
  let client: ReturnType<typeof createClient>;
  let userQueries: UserQueriesModule;

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
        "CREATE TABLE refresh_tokens (",
        "  token TEXT PRIMARY KEY NOT NULL,",
        "  user_id TEXT NOT NULL,",
        "  expires_at INTEGER NOT NULL,",
        "  revoked_at INTEGER,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n"),
    );
  }

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.resetModules();

    client = createClient({ url: ":memory:" });
    const testDb = drizzle(client);

    await createSchema();

    jest.unstable_mockModule("../dbConfig.js", () => ({
      db: testDb,
    }));

    jest.unstable_mockModule("../../config/config.js", () => ({
      config: {
        jwt: {
          refreshExpiry: 60,
        },
      },
    }));

    userQueries = await import("./userQueries.js");
  });

  afterEach(() => {
    client.close();
  });

  test("createUser inserts and returns record", async () => {
    const newUser = await userQueries.createUser({
      id: "u1",
      name: "User 1",
      username: "user1",
      hashedPassword: "hash",
      createdAt: iso("2025-01-01"),
      updatedAt: iso("2025-01-01"),
    });

    expect(newUser).toMatchObject({
      id: "u1",
      name: "User 1",
      username: "user1",
    });
  });

  test("getUserByUsername returns undefined when missing", async () => {
    const user = await userQueries.getUserByUsername("missing");
    expect(user).toBeUndefined();
  });

  test("getUserByUsername returns user when present", async () => {
    await userQueries.createUser({
      id: "u1",
      name: "User 1",
      username: "user1",
      hashedPassword: "hash",
      createdAt: iso("2025-01-01"),
      updatedAt: iso("2025-01-01"),
    });

    const user = (await userQueries.getUserByUsername("user1")) as UserRow;

    expect(user).toMatchObject({
      id: "u1",
      name: "User 1",
      username: "user1",
      hashedPassword: "hash",
    });
  });

  test("getUserNameById returns undefined when missing", async () => {
    const userName = await userQueries.getUserNameById("missing");
    expect(userName).toBeUndefined();
  });

  test("getUserNameById returns name when present", async () => {
    await userQueries.createUser({
      id: "u1",
      name: "User 1",
      username: "user1",
      hashedPassword: "hash",
      createdAt: iso("2025-01-01"),
      updatedAt: iso("2025-01-01"),
    });

    const userName = await userQueries.getUserNameById("u1");
    expect(userName).toBe("User 1");
  });

  test("saveRefreshToken stores token with expiresAt", async () => {
    await exec(
      "INSERT INTO users (id, name, username, hashed_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["u1", "User 1", "user1", "hash", iso("2025-01-01"), iso("2025-01-01")],
    );

    const before = Date.now();
    const [row] = await userQueries.saveRefreshToken("t1", "u1");

    expect(row).toMatchObject({
      token: "t1",
      userId: "u1",
    });
    expect(row.expiresAt).toBeGreaterThanOrEqual(before + 60_000);
  });

  test("getRefreshToken returns undefined when missing", async () => {
    const token = await userQueries.getRefreshToken("missing");
    expect(token).toBeUndefined();
  });

  test("revokeRefreshToken sets revokedAt", async () => {
    await exec(
      "INSERT INTO users (id, name, username, hashed_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["u1", "User 1", "user1", "hash", iso("2025-01-01"), iso("2025-01-01")],
    );

    await exec(
      "INSERT INTO refresh_tokens (token, user_id, expires_at, revoked_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["t1", "u1", Date.now() + 1000, null, iso("2025-01-01"), iso("2025-01-01")],
    );

    const [token] = await userQueries.revokeRefreshToken("t1");

    expect(token?.token).toBe("t1");
    expect(token?.revokedAt).toEqual(expect.any(Number));
  });
});
