import "dotenv/config"; // = dotenv.config()
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";

import { guestsRouter } from "./api/routes/guestsRoute.js";
import { config } from "./config/config.js";
import { authRouter } from "./api/routes/authRoute.js";
import { dishesRouter } from "./api/routes/dishesRoute.js";
import { allergiesRouter } from "./api/routes/allergiesRoute.js";
import { runMigrations } from "./db/dbConfig.js";
import { mealsRouter } from "./api/routes/mealsRoute.js";
import { errorHandler } from "./api/middleware/errorHandler.js";
import { apiLimiter, authLimiter } from "./api/middleware/rateLimiters.js";

const app = express();
const __dirname = path.resolve();

// Railway runs behind a proxy/load balancer. Trust the first proxy hop so `req.ip` reflects the real client IP.
// This is important for rate limiting and logging.
app.set("trust proxy", 1);

app.get("/api/health", (_, res) => {
  res.status(200).json({ ok: true });
});

app.use(express.json());
app.use(cookieParser());

// Start migrations in background so server can respond.
runMigrations().catch((error) => {
  console.error("Database migrations failed", error);
});

if (!config.isProd) {
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );
} else {
  // In prod, the frontend is served from the same origin,
  // but we still enable CORS + credentials for safety.
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
}

// Basic rate limiting (in-memory, per-process).
// If you run behind a proxy/load balancer, ensure `trust proxy` is configured so `req.ip` is correct.
app.use("/api", apiLimiter);

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/guests", guestsRouter);
app.use("/api/dishes", dishesRouter);
app.use("/api/allergies", allergiesRouter);
app.use("/api/meals", mealsRouter);

if (config.isProd) {
  const distPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(distPath));
  app.get("/*splat", (_, res) => {
    // express v5 needs glob patterns to be named
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on PORT:${config.port}`);
});
