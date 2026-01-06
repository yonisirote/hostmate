import type { Request, Response } from "express";
import { vi } from "vitest";

type AuthHandlersModule = typeof import("../authHandler.js");

type RefreshRecord = {
  userId: string;
  revokedAt: Date | null;
  expiresAt: number;
};

type UserRecord = {
  id: string;
  name: string;
  username: string;
  hashedPassword: string;
};

type NewUserRecord = {
  name: string;
  username: string;
  hashedPassword: string;
};

const REQUIRED_ENV = {
  TURSO_DATABASE_URL: "libsql://example",
  TURSO_AUTH_TOKEN: "test-token",
  ACCESS_TOKEN_SECRET: "test-access-secret",
  REFRESH_TOKEN_SECRET: "test-refresh-secret",
  JWT_ISSUER: "meal-planner",
  NODE_ENV: "test",
  PORT: "4000",
};

const mockCreateUser = vi.fn<(user: NewUserRecord) => Promise<UserRecord>>();
const mockGetUserByUsername = vi.fn<(username: string) => Promise<UserRecord | undefined>>();
const mockSaveRefreshToken = vi.fn<(token: string, userId: string) => Promise<void>>();
const mockGetRefreshToken = vi.fn<(token: string) => Promise<RefreshRecord | null>>();
const mockRevokeRefreshToken = vi.fn<(token: string) => Promise<void>>();
const mockGenerateAccessToken = vi.fn<(userId: string, secret: string) => string>();
const mockGenerateRefreshToken = vi.fn<() => string>();
const mockGetBearerToken = vi.fn<(req: Request) => string>();
const mockHashPassword = vi.fn<(password: string) => Promise<string>>();
const mockCheckHashedPassword = vi.fn<(hashed: string, password: string) => Promise<boolean>>();

let handlers: AuthHandlersModule;

beforeAll(() => {
  Object.entries(REQUIRED_ENV).forEach(([key, value]) => {
    process.env[key] = value;
  });
});

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();

  vi.doMock("../../../db/queries/userQueries.js", () => ({
    createUser: mockCreateUser,
    getUserByUsername: mockGetUserByUsername,
    saveRefreshToken: mockSaveRefreshToken,
    getRefreshToken: mockGetRefreshToken,
    revokeRefreshToken: mockRevokeRefreshToken,
  }));

  vi.doMock("../../../auth.js", () => ({
    generateAccessToken: mockGenerateAccessToken,
    generateRefreshToken: mockGenerateRefreshToken,
    getBearerToken: mockGetBearerToken,
    hashPassword: mockHashPassword,
    checkHashedPassword: mockCheckHashedPassword,
  }));

  handlers = await import("../authHandler.js");
});

function createMockResponse() {
  const json = vi.fn();
  const cookie = vi.fn().mockReturnThis();
  const clearCookie = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnThis();
  const send = vi.fn().mockReturnThis();
  const res = {
    status,
    cookie,
    clearCookie,
    send,
    json,
  } as unknown as Response;
  return { res, status, cookie, clearCookie, send, json };
}

describe("signupHandler", () => {
  test("creates user when username free", async () => {
    const input: UserRecord = {
      id: "user-1",
      name: "Alice",
      username: "alice",
      hashedPassword: "hashed-secret",
    };
    mockGetUserByUsername.mockResolvedValue(undefined);
    mockCreateUser.mockResolvedValue(input);
    mockHashPassword.mockResolvedValue("hashed-secret");

    const req = { body: { name: "Alice", username: "alice", password: "secret" } } as Request;
    const { res, status, json } = createMockResponse();

    await handlers.signupHandler(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledWith("alice");
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: "alice",
      name: "Alice",
      hashedPassword: "hashed-secret",
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      name: "Alice",
      username: "alice",
    }));
  });

  test("responds 401 when username missing", async () => {
    const req = { body: { name: "Alice", password: "secret" } } as Request;
    const { res, status, json } = createMockResponse();

    await handlers.signupHandler(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: "Error: Missing user username/name/password" });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test("responds 401 when username already exists", async () => {
    const existing: UserRecord = {
      id: "user-1",
      name: "Alice",
      username: "alice",
      hashedPassword: "hashed-secret",
    };
    mockGetUserByUsername.mockResolvedValue(existing);

    const req = { body: { name: "Alice", username: "alice", password: "secret" } } as Request;
    const { res, status, json } = createMockResponse();

    await handlers.signupHandler(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: "Error: Username already exists" });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});

describe("loginHandler", () => {
  test("returns tokens when credentials valid", async () => {
    const user: UserRecord = {
      id: "user-1",
      name: "Alice",
      username: "alice",
      hashedPassword: "hashed-secret",
    };
    mockGetUserByUsername.mockResolvedValue(user);
    mockCheckHashedPassword.mockResolvedValue(true);
    mockGenerateAccessToken.mockReturnValue("access-token");
    mockGenerateRefreshToken.mockReturnValue("refresh-token");

    const req = { body: { username: "alice", password: "secret" } } as Request;
    const { res, status, json, cookie } = createMockResponse();

    await handlers.loginHandler(req, res);

    expect(mockSaveRefreshToken).toHaveBeenCalledWith("refresh-token", "user-1");
    expect(cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      }),
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      userID: "user-1",
      username: "alice",
      name: "Alice",
      accessToken: "access-token",
    });
  });

  test("throws when username missing", async () => {
    const req = { body: { password: "secret" } } as Request;
    const { res } = createMockResponse();

    await expect(handlers.loginHandler(req, res)).rejects.toThrow("Missing user username/password");
  });

  test("throws when user not found", async () => {
    mockGetUserByUsername.mockResolvedValue(undefined);
    const req = { body: { username: "alice", password: "secret" } } as Request;
    const { res } = createMockResponse();

    await expect(handlers.loginHandler(req, res)).rejects.toThrow("Username does not exist");
  });

  test("throws when password invalid", async () => {
    const user: UserRecord = {
      id: "user-1",
      name: "Alice",
      username: "alice",
      hashedPassword: "hashed-secret",
    };
    mockGetUserByUsername.mockResolvedValue(user);
    mockCheckHashedPassword.mockResolvedValue(false);
    const req = { body: { username: "alice", password: "wrong" } } as Request;
    const { res } = createMockResponse();

    await expect(handlers.loginHandler(req, res)).rejects.toThrow("Password is incorrect");
  });
});

describe("refreshHandler", () => {
  test("responds 401 when refresh token missing", async () => {
    const req = { cookies: {} } as Request;
    const { res } = createMockResponse();

    await expect(handlers.refreshHandler(req, res)).rejects.toThrow("Unauthorized");
    expect(mockGetRefreshToken).not.toHaveBeenCalled();
  });

  test("responds 401 when refresh token not found", async () => {
    const req = { cookies: { refreshToken: "refresh-token" } } as unknown as Request;
    mockGetRefreshToken.mockResolvedValue(null);

    const { res } = createMockResponse();

    await expect(handlers.refreshHandler(req, res)).rejects.toThrow("Invalid refresh token");

    expect(mockGetRefreshToken).toHaveBeenCalledWith("refresh-token");
  });

  test("responds 401 when token already revoked", async () => {
    const stored: RefreshRecord = {
      userId: "user-1",
      revokedAt: new Date(),
      expiresAt: Date.now() + 10_000,
    };

    mockGetRefreshToken.mockResolvedValue(stored);
  const req = { cookies: { refreshToken: "refresh-token" } } as unknown as Request;
    const { res } = createMockResponse();

    await expect(handlers.refreshHandler(req, res)).rejects.toThrow("Invalid refresh token");
    expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
  });

  test("revokes expired tokens and responds 401", async () => {
    const stored: RefreshRecord = {
      userId: "user-1",
      revokedAt: null,
      expiresAt: Date.now() - 1,
    };

    mockGetRefreshToken.mockResolvedValue(stored);
  const req = { cookies: { refreshToken: "refresh-token" } } as unknown as Request;
    const { res } = createMockResponse();

    await expect(handlers.refreshHandler(req, res)).rejects.toThrow("Refresh token expired");

    expect(mockRevokeRefreshToken).toHaveBeenCalledWith("refresh-token");
  });

  test("returns new access token when refresh valid", async () => {
    const stored: RefreshRecord = {
      userId: "user-1",
      revokedAt: null,
      expiresAt: Date.now() + 60_000,
    };

    mockGetRefreshToken.mockResolvedValue(stored);
    mockGenerateAccessToken.mockReturnValue("new-access-token");

  const req = { cookies: { refreshToken: "refresh-token" } } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.refreshHandler(req, res);

    expect(mockGenerateAccessToken).toHaveBeenCalledWith("user-1", REQUIRED_ENV.ACCESS_TOKEN_SECRET);
    expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ accessToken: "new-access-token" });
  });

  test("treats tokens expiring at the current instant as valid", async () => {
    const now = Date.now();
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(now);

    const stored: RefreshRecord = {
      userId: "user-1",
      revokedAt: null,
      expiresAt: now,
    };

    mockGetRefreshToken.mockResolvedValue(stored);
    mockGenerateAccessToken.mockReturnValue("edge-access-token");

    const req = { cookies: { refreshToken: "refresh-token" } } as unknown as Request;
    const { res, status, json } = createMockResponse();

    await handlers.refreshHandler(req, res);

    expect(mockGenerateAccessToken).toHaveBeenCalledWith("user-1", REQUIRED_ENV.ACCESS_TOKEN_SECRET);
    expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ accessToken: "edge-access-token" });

    nowSpy.mockRestore();
  });

  test("rejects tokens flagged as revoked even when not expired", async () => {
    const stored: RefreshRecord = {
      userId: "user-1",
      revokedAt: new Date(),
      expiresAt: Date.now() + 60_000,
    };

    mockGetRefreshToken.mockResolvedValue(stored);

    const req = { cookies: { refreshToken: "refresh-token" } } as unknown as Request;
    const { res } = createMockResponse();

    await expect(handlers.refreshHandler(req, res)).rejects.toThrow("Invalid refresh token");

    expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
  });
});

describe("revokeHandler", () => {
  test("revokes refresh token, clears cookie, and returns 204", async () => {
    mockRevokeRefreshToken.mockResolvedValue();
    const { res, status, clearCookie } = createMockResponse();
    const req = { cookies: { refreshToken: "refresh-token" } } as unknown as Request;

    await handlers.revokeHandler(req, res);

    expect(mockRevokeRefreshToken).toHaveBeenCalledWith("refresh-token");
    expect(clearCookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      }),
    );
    expect(status).toHaveBeenCalledWith(204);
  });
});
