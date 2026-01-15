import express from "express";
import {
  addGuestHandler,
  getGuestByRankTokenHandler,
  getGuestsByUserHandler,
  getGuestDishesHandler,
  rankDishByRankTokenHandler,
  rankDishHandler,
  updateGuestHandler,
  deleteGuestHandler,
} from "../handlers/guestsHandler.js";

export const guestsRouter = express.Router();

guestsRouter.get("/", getGuestsByUserHandler);
guestsRouter.post("/", addGuestHandler);
guestsRouter.put("/:guestId", updateGuestHandler);
guestsRouter.delete("/:guestId", deleteGuestHandler);

guestsRouter.get("/:guestId/dishes", getGuestDishesHandler);
guestsRouter.post("/:guestId/dishes/:dishId", rankDishHandler);

guestsRouter.get("/token/:rankToken", getGuestByRankTokenHandler);
guestsRouter.post("/token/:rankToken/dishes/:dishId", rankDishByRankTokenHandler);
