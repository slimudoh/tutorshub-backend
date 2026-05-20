import { Router } from "express";
import { getNewCurrencyRates } from "../controllers/currency.controllers";
import {
  checkSubscriptionExpiry,
  sendSubscriptionExpiryNotification,
} from "../controllers/pricing.controllers";

const router = Router();

router.get("/update-all-currencies", getNewCurrencyRates);
router.get("/check-subscriptions-expiry", checkSubscriptionExpiry);
router.get(
  "/subscriptions-expiry-notification",
  sendSubscriptionExpiryNotification,
);

export default router;
