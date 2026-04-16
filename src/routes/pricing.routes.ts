import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getPricingPlans,
  getSubscriptionPlans,
  getAdminPricingPlans,
  reviewAdminPricingPlan,
} from "../controllers/pricing.controllers";
import isAdmin from "../middlewares/admin.middlewares";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";

const router = Router();

router.get("/", getPricingPlans);

router.get("/subscription-plans", isAuth, isUser, getSubscriptionPlans);

router.get("/admin-pricing-plans", isAuth, isAdmin, getAdminPricingPlans);

router.patch(
  "/review-admin-pricing-plans",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewAdminPricingPlan,
);

export default router;
