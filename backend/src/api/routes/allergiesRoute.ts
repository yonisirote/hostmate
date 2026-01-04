import express from "express";

import {
  getAllergiesListHandler,
  getDishAllergensHandler,
  getGuestAllergiesHandler,
  setDishAllergensHandler,
  setGuestAllergiesHandler,
} from "../handlers/allergiesHandler.js";

export const allergiesRouter = express.Router();

allergiesRouter.get("/", getAllergiesListHandler);

allergiesRouter.get("/guests/:guestId", getGuestAllergiesHandler);
allergiesRouter.put("/guests/:guestId", setGuestAllergiesHandler);

allergiesRouter.get("/dishes/:dishId", getDishAllergensHandler);
allergiesRouter.put("/dishes/:dishId", setDishAllergensHandler);
