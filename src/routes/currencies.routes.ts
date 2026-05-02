import { Router } from "express";
import isAdmin from "../middlewares/admin.middlewares";
import isAuth from "../middlewares/auth.middlewares";
import {
  updateCurrencies,
  getAllActiveCurrencies,
  getCurrencies,
  getCurrencyDetails,
  getNewCurrencyRates,
  reviewCurrencies,
} from "../controllers/currency.controllers";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";

const router = Router();

// router.get("/", isAuth, isAdmin, getCurrencies);

// router.get("/active-currencies", isAuth, isAdmin, getAllActiveCurrencies);

// router.get("/update-all-currencies", getNewCurrencyRates);

// router.patch(
//   "/review-currencies",
//   check("id").notEmpty().withMessage("ID is required."),
//   check("status").notEmpty().withMessage("Status is required."),
//   Validate,
//   isAuth,
//   isAdmin,
//   reviewCurrencies,
// );

// router.patch(
//   "/update-currencies",
//   check("id").notEmpty().withMessage("ID is required."),
//   check("country").notEmpty().withMessage("Country is required."),
//   check("currency").notEmpty().withMessage("Currency is required."),
//   Validate,
//   isAuth,
//   isAdmin,
//   updateCurrencies,
// );

// router.get("/:id", isAuth, isAdmin, getCurrencyDetails);

export default router;
