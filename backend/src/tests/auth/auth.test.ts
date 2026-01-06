import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request } from "express";

type AuthModule = typeof import("../../auth.js");

type ConfigModule = typeof import("../../config/config.js");

const REQUIRED_ENV = {
  TURSO_DATABASE_URL: "libsql://example",
  TURSO_AUTH_TOKEN: "test-token",
  ACCESS_TOKEN_SECRET: "test-access-secret",
  REFRESH_TOKEN_SECRET: "test-refresh-secret",
  JWT_ISSUER: "meal-planner",
  NODE_ENV: "test",
  PORT: "4000",
};

let auth: AuthModule;
let configModule: ConfigModule;

beforeAll(() => {
  Object.entries(REQUIRED_ENV).forEach(([key, value]) => {
    process.env[key] = value;
  });
});


beforeEach(async () => {
  vi.resetModules();
  auth = await import("../../auth.js");
  configModule = await import("../../config/config.js");
});

describe("auth token helpers", () => {
  test("generateAccessToken creates a signed token with expected claims", () => {
    const userId = "user-123";
    const token = auth.generateAccessToken(userId, process.env.ACCESS_TOKEN_SECRET!);
    const decoded = jwt.decode(token) as JwtPayload | null;

    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe(userId);
    expect(decoded?.iss).toBe(process.env.JWT_ISSUER);
    expect(typeof decoded?.iat).toBe("number");
    expect(typeof decoded?.exp).toBe("number");
    if (decoded?.iat && decoded.exp) {
      expect(decoded.exp - decoded.iat).toBe(configModule.config.jwt.defaultExpiry);
    }
  });

  test("validateToken reports valid tokens", () => {
    const userId = "valid-user";
    const token = auth.generateAccessToken(userId, process.env.ACCESS_TOKEN_SECRET!);
    const result = auth.validateToken(token, process.env.ACCESS_TOKEN_SECRET!);

    expect(result.valid).toBe(true);
    expect(result.expired).toBe(false);
    expect(result.payload?.sub).toBe(userId);
  });

  test("validateToken flags expired tokens", () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 10;
    const expiredToken = jwt.sign(
      {
        iss: process.env.JWT_ISSUER,
        sub: "old-user",
        iat: issuedAt,
        exp: issuedAt - 1,
      },
      process.env.ACCESS_TOKEN_SECRET!,
    );

    const result = auth.validateToken(expiredToken, process.env.ACCESS_TOKEN_SECRET!);

    expect(result.valid).toBe(false);
    expect(result.expired).toBe(true);
    expect(result.payload).toBeNull();
  });

  test("generateRefreshToken returns unique hex tokens", () => {
    const tokenA = auth.generateRefreshToken();
    const tokenB = auth.generateRefreshToken();

    expect(tokenA).toHaveLength(64);
    expect(tokenB).toHaveLength(64);
    expect(tokenA).not.toEqual(tokenB);
    expect(/^[0-9a-f]+$/i.test(tokenA)).toBe(true);
    expect(/^[0-9a-f]+$/i.test(tokenB)).toBe(true);
  });

  test("getBearerToken reads tokens from Authorization headers", () => {
    const fakeRequest = {
      get: (header: string) => (header === "Authorization" ? "Bearer abc.def" : undefined),
    } as unknown as Request;

    expect(auth.getBearerToken(fakeRequest)).toBe("abc.def");
  });

  test("getBearerToken throws when header is missing", () => {
    const fakeRequest = {
      get: () => undefined,
    } as unknown as Request;

    expect(() => auth.getBearerToken(fakeRequest)).toThrow("Invalid authorization header");
  });

  test("hashPassword returns an argon2 hash and checkHashedPassword accepts it", async () => {
    const plain = "super-secret";

    const hashed = await auth.hashPassword(plain);

    expect(typeof hashed).toBe("string");
    expect(hashed).not.toBe(plain);
    expect(hashed.startsWith("$argon2")).toBe(true);

    const matches = await auth.checkHashedPassword(hashed, plain);
    expect(matches).toBe(true);
  });

  test("checkHashedPassword rejects incorrect passwords", async () => {
    const hashed = await auth.hashPassword("correct-horse-battery-staple");

    const matches = await auth.checkHashedPassword(hashed, "wrong-password");
    expect(matches).toBe(false);
  });
});
