import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getPricingPlans,
  getSubscriptionPlans,
  getAdminPricingPlans,
  reviewAdminPricingPlan,
  createPricingPlans,
  getPricingPlan,
  updatePricingPlans,
  autoRenewSubscription,
  cancelSubscriptionPlans,
} from "../controllers/pricing.controllers";
import isAdmin from "../middlewares/admin.middlewares";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";

const router = Router();

router.get("/", getPricingPlans);

router.get("/subscription-plans", isAuth, isUser, getSubscriptionPlans);

router.get("/admin-pricing-plans", isAuth, isAdmin, getAdminPricingPlans);

router.post(
  "/",
  check("title").notEmpty().withMessage("Title is required."),
  check("description").notEmpty().withMessage("Description is required."),
  check("amount").notEmpty().withMessage("Amount is required."),
  check("amountPerSession")
    .notEmpty()
    .withMessage("Amount per session is required."),
  check("instructorPercentageFee")
    .notEmpty()
    .withMessage("Instructor percentage fee is required."),
  check("platformPercentageFee")
    .notEmpty()
    .withMessage("Platform percentage fee is required."),
  check("currency").notEmpty().withMessage("Currency is required."),
  check("billingCycle").notEmpty().withMessage("Billing cycle is required."),
  check("lessonLimit").notEmpty().withMessage("Lesson limit is required."),
  check("features").notEmpty().withMessage("Features is required."),

  Validate,
  isAuth,
  isAdmin,
  createPricingPlans,
);

router.patch(
  "/review-admin-pricing-plans",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewAdminPricingPlan,
);

router.patch(
  "/subscription-auto-renew",
  check("id").notEmpty().withMessage("ID is required."),
  check("autoRenew").notEmpty().withMessage("Auto renew is required."),
  Validate,
  isAuth,
  isUser,
  autoRenewSubscription,
);

router.patch(
  "/cancel-subscription-plans",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isUser,
  cancelSubscriptionPlans,
);

router.patch(
  "/:id",
  check("title").notEmpty().withMessage("Title is required."),
  check("description").notEmpty().withMessage("Description is required."),
  check("amount").notEmpty().withMessage("Amount is required."),
  check("amountPerSession")
    .notEmpty()
    .withMessage("Amount per session is required."),
  check("instructorPercentageFee")
    .notEmpty()
    .withMessage("Instructor percentage fee is required."),
  check("platformPercentageFee")
    .notEmpty()
    .withMessage("Platform percentage fee is required."),
  check("currency").notEmpty().withMessage("Currency is required."),
  check("billingCycle").notEmpty().withMessage("Billing cycle is required."),
  check("lessonLimit").notEmpty().withMessage("Lesson limit is required."),
  check("features").notEmpty().withMessage("Features is required."),
  Validate,
  isAuth,
  isAdmin,
  updatePricingPlans,
);

router.get("/:id", getPricingPlan);

export default router;
