import "dotenv/config"; // = dotenv.config()
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";

import { guestsRouter } from "./api/routes/guestsRoute.js";
import { config } from "./config/config.js"
import { authRouter } from "./api/routes/authRoute.js";
import { dishesRouter } from "./api/routes/dishesRoute.js";
import { runMigrations } from "./db/dbConfig.js";
import { mealsRouter } from "./api/routes/mealsRoute.js";
import { errorHandler } from "./api/middleware/errorHandler.js";

await runMigrations();

const app = express();
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());

if (!config.isProd){
  app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
  }));
}

app.use("/api/auth", authRouter);
app.use("/api/guests", guestsRouter);
app.use("/api/dishes", dishesRouter);
app.use("/api/meals", mealsRouter);

if (config.isProd) {
  const distPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(distPath));
  app.get("/*splat", (_, res) => {   // express v5 needs glob patterns to be named
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);


app.listen(config.port, () => {
  console.log(`Server running on PORT:${config.port}`);
});