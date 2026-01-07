import express from "express";

import {
  getAllergiesListHandler,
  getDishAllergensHandler,
  getDishAllergensMapHandler,
  getGuestAllergiesHandler,
  getGuestAllergiesMapHandler,
  setDishAllergensHandler,
  setGuestAllergiesHandler,
} from "../handlers/allergiesHandler.js";

export const allergiesRouter = express.Router();

allergiesRouter.get("/", getAllergiesListHandler);

allergiesRouter.get("/guests/:guestId", getGuestAllergiesHandler);
allergiesRouter.get("/guests", getGuestAllergiesMapHandler);
allergiesRouter.put("/guests/:guestId", setGuestAllergiesHandler);

allergiesRouter.get("/dishes/:dishId", getDishAllergensHandler);
allergiesRouter.get("/dishes", getDishAllergensMapHandler);
allergiesRouter.put("/dishes/:dishId", setDishAllergensHandler);
