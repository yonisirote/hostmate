import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

/**
 * Basic API rate limiting middleware.
 *
 * Notes:
 * - Uses in-memory store by default (per-process). If you run multiple instances,
 *   limits apply per instance unless you add a shared store (Redis, etc).
 * - Express v5: `req.ip` requires `app.set("trust proxy", ...)` when behind a proxy
 *   (e.g. Render/NGINX) so client IPs are correct.
 */

type CreateLimiterOptions = {
  windowMs: number;
  max: number;
  message: string;
};

function createLimiter({ windowMs, max, message }: CreateLimiterOptions): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
  });
}

/**
 * General API limiter (sensible default).
 * Intended to be attached broadly (e.g. `app.use("/api", apiLimiter)`).
 */
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests / 15 min / IP
  message: "Too many requests, please try again later.",
});

/**
 * Stricter limiter for auth endpoints (login/signup/refresh/revoke).
 * Intended usage: `app.use("/api/auth", authLimiter, authRouter)`.
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests / 15 min / IP
  message: "Too many authentication attempts, please try again later.",
});

/**
 * Very strict limiter for login specifically (optional).
 * Useful if you want to clamp only the riskiest endpoint without impacting signup/refresh.
 */
export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests / 15 min / IP
  message: "Too many login attempts, please try again later.",
});
