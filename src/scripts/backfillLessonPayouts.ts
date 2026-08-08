// scripts/backfillLessonPayouts.ts
import Lesson from "../models/lesson.models";
import LessonAttendance from "../models/lessonAttendance.models";
import Transaction from "../models/transaction.models";
import { LESSON, LESSON_ATTENDANCE, TRANSACTION_TYPE } from "../utils/constant";
import { processLessonPayout } from "../services/lesson.services";
import { Op } from "sequelize";

export const backfillLessonPayouts = async () => {
  console.log("[backfill] Starting lesson payout backfill...");

  const completedLessons = await Lesson.findAll({
    where: { status: LESSON.COMPLETED },
    raw: true,
  });

  console.log({ completedLessons });

  if (!completedLessons.length) {
    console.log("[backfill] No completed lessons found.");
    return;
  }

  console.log(`[backfill] Found ${completedLessons.length} completed lessons.`);

  let skipped = 0;
  let processed = 0;
  let failed = 0;

  for (const lesson of completedLessons) {
    try {
      // Skip if payout already exists for this lesson
      const existingEarning = await Transaction.findOne({
        where: {
          userId: lesson.userId,
          transactionType: TRANSACTION_TYPE.EARNING,
          purpose: `Lesson Earning for ${lesson.title} (${lesson.id})`,
        },
        raw: true,
      });

      if (existingEarning) {
        skipped++;
        continue;
      }

      const hasEligibleAttendance = await LessonAttendance.findOne({
        where: {
          lessonId: lesson.id,
          isHost: false,
          payoutAmount: { [Op.ne]: null },
          eligibleForPayout: true,
        },
        raw: true,
      });

      if (!hasEligibleAttendance) {
        skipped++;
        continue;
      }

      await processLessonPayout(lesson);
      processed++;
      console.log(`[backfill] Processed: ${lesson.title} (${lesson.id})`);
    } catch (err) {
      failed++;
      console.error(`[backfill] Failed for lesson ${lesson.id}:`, err);
      // Don't rethrow — keep processing the rest
    }
  }

  console.log(
    `[backfill] Done. Processed: ${processed}, Skipped: ${skipped}, Failed: ${failed}`,
  );
};
