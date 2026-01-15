import express from "express";
import request from "supertest";
import { describe, expect, test, vi } from "vitest";

/**
 * These are lightweight integration-style tests for the composed auth router.
 *
 * What we verify:
 * 1) Route-level limiter is attached to POST /login (stricter than the authRouter-level limiter).
 * 2) When `trust proxy` is enabled, Express uses X-Forwarded-For for `req.ip`,
 *    so rate limiting keys off the real client IP (as on Railway).
 *
 * Notes:
 * - We mock the auth handler to avoid DB/env deps and keep the test focused on rate limiting.
 * - We mount `authLimiter` at `/api/auth` (as `server.ts` does) and `authRouter` under it,
 *   then call `/api/auth/login`.
 */

vi.mock("../../handlers/authHandler.js", () => ({
  loginHandler: (_req: unknown, res: any) => res.status(200).json({ ok: true }),
  signupHandler: (_req: unknown, res: any) =>
    res.status(200).json({ ok: true }),
  refreshHandler: (_req: unknown, res: any) =>
    res.status(200).json({ ok: true }),
  revokeHandler: (_req: unknown, res: any) =>
    res.status(200).json({ ok: true }),
}));

import { authRouter } from "../authRoute.js";
import { authLimiter } from "../../middleware/rateLimiters.js";

function createApp({ trustProxy }: { trustProxy: boolean }) {
  const app = express();
  app.use(express.json());

  if (trustProxy) {
    // Same setting we use in `server.ts` for Railway: trust the first proxy hop.
    app.set("trust proxy", 1);
  }

  // Mirror server composition for auth:
  // server.ts: app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/auth", authLimiter, authRouter);

  return app;
}

describe("authRoute rate limiting", () => {
  test("POST /api/auth/login is limited by the strict login limiter", async () => {
    const app = createApp({ trustProxy: false });

    // `loginLimiter` is configured as: 10 requests per 15 minutes per IP.
    // We expect the first 10 to succeed, and the 11th to be 429.
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "u", password: "p" })
        .expect(200);

      expect(res.body).toEqual({ ok: true });
    }

    const limited = await request(app)
      .post("/api/auth/login")
      .send({ username: "u", password: "p" })
      .expect(429);

    // express-rate-limit returns JSON because we configured `message: { message }`
    expect(limited.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/too many login attempts/i),
      }),
    );
  });

  test("with trust proxy enabled, different X-Forwarded-For IPs do not share the same rate limit bucket", async () => {
    const app = createApp({ trustProxy: true });

    const ipA = "203.0.113.10";
    const ipB = "203.0.113.11";

    // Consume the full limit for IP A
    for (let i = 0; i < 10; i += 1) {
      await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", ipA)
        .send({ username: "u", password: "p" })
        .expect(200);
    }

    // Next request from IP A should be blocked
    await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", ipA)
      .send({ username: "u", password: "p" })
      .expect(429);

    // But IP B should still be allowed (separate bucket)
    await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", ipB)
      .send({ username: "u", password: "p" })
      .expect(200);
  });

  // NOTE: We intentionally do not test the "no trust proxy" X-Forwarded-For behavior here.
  // In practice it can be unstable under test runners/supertest because the underlying request
  // IP may vary in ways that impact express-rate-limit bucketing. The important behavior for
  // Railway is covered by the `trust proxy` test above.
});
