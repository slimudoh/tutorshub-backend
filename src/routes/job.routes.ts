import { Router } from "express";
import { getNewCurrencyRates } from "../controllers/currency.controllers";
import {
  checkSubscriptionExpiry,
  sendSubscriptionExpiryNotification,
} from "../controllers/pricing.controllers";
import { sendLessonNotification } from "../controllers/lesson.controllers";

const router = Router();

// once daily
router.get("/update-all-currencies", getNewCurrencyRates);

// every 1 hour
router.get("/check-subscriptions-expiry", checkSubscriptionExpiry);
router.get(
  "/subscriptions-expiry-notification",
  sendSubscriptionExpiryNotification,
);

// eery 1 minute
router.get("/send-lesson-notification", sendLessonNotification);

export default router;
