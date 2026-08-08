import cron from "node-cron";
import {
  cleanupEndedLessons,
  cleanupStaleAttendance,
  sendUserLessonNotification,
} from "../services/lesson.services";
import {
  renewSubscriptionPlans,
  sendExpiryNotification,
} from "../services/pricing.services";
import { updateCurrencyRates } from "../services/currency.services";
import { sendErrorDigest } from "../services/errorDigest.services";
// import { backfillLessonPayouts } from "../scripts/backfillLessonPayouts";

export const startCronJobs = () => {
  // Every minute — lesson notifications only
  cron.schedule("* * * * *", async () => {
    try {
      await sendUserLessonNotification();
      // await backfillLessonPayouts();
      console.info("sendUserLessonNotification job completed");
      // console.info("backfillLessonPayouts job completed");
    } catch (err) {
      console.error("[cron] lesson notification failed:", err);
    }
  });

  // Every 5 minutes — attendance and lesson cleanup
  cron.schedule("*/5 * * * *", async () => {
    try {
      await Promise.all([cleanupStaleAttendance(), cleanupEndedLessons()]);
      console.info("cleanupStaleAttendance job completed");
      console.info("cleanupEndedLessons job completed");
    } catch (err) {
      console.error("[cron] cleanup failed:", err);
    }
  });

  // Every hour — subscription expiry notifications and renewals

  cron.schedule("0 * * * *", async () => {
    try {
      await Promise.all([
        sendExpiryNotification(),
        renewSubscriptionPlans(),
        sendErrorDigest(),
      ]);
      console.info("sendExpiryNotification job completed");
      console.info("renewSubscriptionPlans job completed");
      console.info("sendErrorDigest job completed");
    } catch (err) {
      console.error("[cron] hourly job failed:", err);
    }
  });

  // Every day at midnight — currency rates update
  cron.schedule("0 0 * * *", async () => {
    try {
      await updateCurrencyRates();

      console.info("updateCurrencyRates job completed");
    } catch (err) {
      console.error("[cron] currency rates update failed:", err);
    }
  });
};
