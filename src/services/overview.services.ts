import Lesson from "../models/lesson.models";
import Transaction from "../models/transaction.models";
import User from "../models/user.models";
import {
  CATEGORY,
  CONTACT,
  CURRENCY,
  LESSON,
  TRANSACTION_TYPE,
  USER,
} from "../utils/constant";
import Currency from "../models/currency.models";
import Enrollee from "../models/enrollee.models";
import Review from "../models/review.models";
import Category from "../models/category.models";
import Newsletter from "../models/newsletter.models";
import PricingPlan from "../models/pricingPlan.models";
import ContactMessage from "../models/ContactMessage.models";
import AuditLog from "../models/auditLog.models";
import { Op } from "@sequelize/core";

export const getAdminOverviewData = async () => {
  const transactions = await Transaction.count();
  const enrollees = await Enrollee.count();
  const reviews = await Review.count();
  const currencies = await Currency.count({
    where: {
      status: CURRENCY.ACTIVE,
    },
  });
  const user = await User.count({
    where: {
      status: USER.ACTIVE,
    },
  });
  const categories = await Category.count({
    where: {
      status: CATEGORY.ACTIVE,
    },
  });
  const lessons = await Lesson.count({
    where: {
      status: LESSON.ACTIVE,
    },
  });
  const newsletterSubscribers = await Newsletter.count();
  const pricing = await PricingPlan.count();
  const contactMessages = await ContactMessage.count({
    where: {
      status: {
        [Op.in]: [CONTACT.NEW, CONTACT.IN_PROGRESS],
      },
    },
  });
  const auditLogs = await AuditLog.count();

  return {
    user,
    lessons,
    currencies,
    transactions,
    enrollees,
    reviews,
    categories,
    pricing,
    newsletterSubscribers,
    auditLogs,
    contactMessages,
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

  const enrollees = await Enrollee.count({
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
