import Lesson from "../models/lesson.models";
import Transaction from "../models/transaction.models";
import User from "../models/user.models";
import { STATUS, TRANSACTION_TYPE } from "../utils/constant";
import Currency from "../models/currency.models";
import Enrollee from "../models/enrollee.models";
import Review from "../models/review.models";

export const getAdminOverviewData = async () => {
  const totalTransactions = await Transaction.findAll();
  const totalEnrollees = await Enrollee.count();

  const totalReviews = await Review.count();
  const totalActiveCurrencies = await Currency.count({
    where: {
      status: STATUS.ACTIVE,
    },
  });
  const totalUsers = await User.findAll();
  const totalActiveUsers = totalUsers.filter(
    (user) => user.status === STATUS.ACTIVE,
  ).length;
  const totalPendingUsers = totalUsers.filter(
    (user) => user.status === STATUS.PENDING,
  ).length;
  const totalSuspendedUsers = totalUsers.filter(
    (user) => user.status === STATUS.SUSPENDED,
  ).length;
  const totalDeactivatedUsers = totalUsers.filter(
    (user) => user.status === STATUS.DEACTIVATED,
  ).length;

  const totalLessons = await Lesson.findAll();
  const totalActiveLessons = totalLessons.filter(
    (lesson) => lesson.status === STATUS.ACTIVE,
  ).length;
  const totalPendingLessons = totalLessons.filter(
    (lesson) => lesson.status === STATUS.PENDING,
  ).length;
  const totalSuspendedLessons = totalLessons.filter(
    (lesson) => lesson.status === STATUS.SUSPENDED,
  ).length;
  const totalDeactivatedLessons = totalLessons.filter(
    (lesson) => lesson.status === STATUS.DEACTIVATED,
  ).length;

  return {
    totalUsers: totalUsers.length,
    totalActiveUsers,
    totalPendingUsers,
    totalSuspendedUsers,
    totalDeactivatedUsers,
    totalLessons: totalLessons.length,
    totalActiveLessons,
    totalPendingLessons,
    totalSuspendedLessons,
    totalDeactivatedLessons,
    totalActiveCurrencies,
    totalEarnings: totalTransactions.filter(
      (transaction) => transaction.transactionType === TRANSACTION_TYPE.EARNING,
    ).length,
    totalPayouts: totalTransactions.filter(
      (transaction) => transaction.transactionType === TRANSACTION_TYPE.PAYOUT,
    ).length,
    totalPayments: totalTransactions.filter(
      (transaction) => transaction.transactionType === TRANSACTION_TYPE.PAYMENT,
    ).length,
    totalEnrollees,
    totalReviews,
  };
};

export const getUserOverviewData = async (userId: string) => {
  const transactions = await Transaction.findAll({
    where: {
      userId,
    },
  });

  const lesson = await Lesson.findAll({
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
    lesson: lesson.length,
    activeLessons: lesson.filter((lesson) => lesson.status === STATUS.ACTIVE)
      .length,
    pendingLessons: lesson.filter((lesson) => lesson.status === STATUS.PENDING)
      .length,
    suspendedLessons: lesson.filter(
      (lesson) => lesson.status === STATUS.SUSPENDED,
    ).length,
    deactivatedLessons: lesson.filter(
      (lesson) => lesson.status === STATUS.DEACTIVATED,
    ).length,
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
