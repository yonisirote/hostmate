import express from "express";
import {
  loginHandler,
  refreshHandler,
  revokeHandler,
  signupHandler,
} from "../handlers/authHandler.js";
import { loginLimiter } from "../middleware/rateLimiters.js";

export const authRouter = express.Router();

authRouter.post("/signup", signupHandler);
authRouter.post("/login", loginLimiter, loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/revoke", revokeHandler);
