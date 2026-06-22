import Lesson from "../models/lesson.models";
import Transaction from "../models/transaction.models";
import User from "../models/user.models";
import { CURRENCY, TRANSACTION_TYPE } from "../utils/constant";
import Currency from "../models/currency.models";
import Review from "../models/review.models";
import Category from "../models/category.models";
import Newsletter from "../models/newsletter.models";
import PricingPlan from "../models/pricingPlan.models";
import Message from "../models/message.models";
import AuditLog from "../models/auditLog.models";
import { Op } from "@sequelize/core";
import Report from "../models/report.models";
import LessonEnrollment from "../models/lessonEnrollment.models";
import Instructor from "../models/instructor.models";

export const getAdminOverviewData = async () => {
  const [
    transactions,
    enrollees,
    reviews,
    currencies,
    users,
    instructors,
    categories,
    lessons,
    newsletterSubscribers,
    pricing,
    messages,
    reports,
    auditLogs,
  ] = await Promise.all([
    Transaction.count(),
    LessonEnrollment.count(),
    Review.count(),
    Currency.count({ where: { status: CURRENCY.ACTIVE } }),
    User.count(),
    Instructor.count(),
    Category.count(),
    Lesson.count(),
    Newsletter.count(),
    PricingPlan.count(),
    Message.count(),
    Report.count(),
    AuditLog.count(),
  ]);

  return {
    users,
    instructors,
    lessons,
    currencies,
    transactions,
    enrollees,
    reviews,
    categories,
    pricing,
    newsletterSubscribers,
    auditLogs,
    messages,
    reports,
  };
};

export const getUserOverviewData = async (userId: string) => {
  const lessonIds = await Lesson.findAll({
    where: { userId },
    attributes: ["id"],
    raw: true,
  }).then((rows) => rows.map((r) => r.id));

  const [lessons, earnings, payouts, payments, enrollees, reviews] =
    await Promise.all([
      Lesson.count({ where: { userId } }),

      Transaction.count({
        where: { userId, transactionType: TRANSACTION_TYPE.EARNING },
      }),
      Transaction.count({
        where: { userId, transactionType: TRANSACTION_TYPE.PAYOUT },
      }),
      Transaction.count({
        where: { userId, transactionType: TRANSACTION_TYPE.PAYMENT },
      }),

      lessonIds.length
        ? LessonEnrollment.count({
            where: { lessonId: { [Op.in]: lessonIds } },
          })
        : Promise.resolve(0),

      lessonIds.length
        ? Review.count({ where: { lessonId: { [Op.in]: lessonIds } } })
        : Promise.resolve(0),
    ]);

  return { lessons, earnings, payouts, payments, enrollees, reviews };
};
