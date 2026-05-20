import Lesson from "../models/lesson.models";
import Transaction from "../models/transaction.models";
import User from "../models/user.models";
import {
  CATEGORY,
  MESSAGE,
  CURRENCY,
  LESSON,
  REPORT,
  TRANSACTION_TYPE,
  USER,
  INSTRUCTOR,
} from "../utils/constant";
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
  const transactions = await Transaction.count();
  const enrollees = await LessonEnrollment.count();
  const reviews = await Review.count();
  const currencies = await Currency.count({
    where: {
      status: CURRENCY.ACTIVE,
    },
  });
  const users = await User.count();
  const instructors = await Instructor.count();
  const categories = await Category.count();
  const lessons = await Lesson.count();
  const newsletterSubscribers = await Newsletter.count();
  const pricing = await PricingPlan.count();
  const messages = await Message.count();
  const reports = await Report.count();
  const auditLogs = await AuditLog.count();

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
  const transactions = await Transaction.findAll({
    where: {
      userId,
    },
  });

  const lesson = await Lesson.count({
    where: {
      userId,
    },
  });

  const enrollees = await LessonEnrollment.count({
    where: {
      userId,
    },
  });

  const reviews = await Review.count({
    where: {
      userId,
    },
  });

  return {
    lesson,
    earnings: transactions.filter(
      (transactions) =>
        transactions.transactionType === TRANSACTION_TYPE.EARNING,
    ).length,
    payouts: transactions.filter(
      (transactions) =>
        transactions.transactionType === TRANSACTION_TYPE.PAYOUT,
    ).length,
    payments: transactions.filter(
      (transactions) =>
        transactions.transactionType === TRANSACTION_TYPE.PAYMENT,
    ).length,
    enrollees,
    reviews,
  };
};
