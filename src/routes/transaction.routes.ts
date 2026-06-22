import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import {
  getPayments,
  getEarnings,
  getPayouts,
  getAllTransactions,
  getTransactionDetails,
  changePricingPlan,
} from "../controllers/transaction.controllers";
import isUser from "../middlewares/user.middlewares";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";

const router = Router();

router.get("/", isAuth, isAdmin, getAllTransactions);

router.get("/earnings", isAuth, isUser, getEarnings);

router.get("/payouts", isAuth, isUser, getPayouts);

router.get("/payments", isAuth, isUser, getPayments);

router.patch(
  "/change-pricing-plan",
  check("planId").notEmpty().withMessage("Plan ID is required."),
  check("reference").notEmpty().withMessage("Reference is required."),
  check("autoRenew").notEmpty().withMessage("Auto renew is required."),
  Validate,
  isAuth,
  isUser,
  changePricingPlan,
);

router.get("/:id", isAuth, isUser, getTransactionDetails);

export default router;
