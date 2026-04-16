import Course from "../models/course.models";
import Transaction from "../models/transaction.models";
import User from "../models/user.models";
import { STATUS } from "../utils/constant";
import Currency from "../models/currency.models";

export const getAdminOverviewData = async () => {
  const totalUsers = await User.count();
  const totalCourses = await Course.count();
  const totalTransactions = await Transaction.count();
  const totalActiveCurrencies = await Currency.count({
    where: {
      status: STATUS.ACTIVE,
    },
  });

  return {
    totalUsers,
    totalCourses,
    totalTransactions,
    totalActiveCurrencies,
  };
};

export const getUserOverviewData = async (userId: string) => {
  const courses = await Course.count({
    where: {
      userId,
    },
  });

  const liveCourses = await Course.count({
    where: {
      userId,
      isLive: true,
    },
  });

  const totalTransactions = await Transaction.count({
    where: {
      userId,
    },
  });

  return {
    courses,
    liveCourses,
    totalTransactions,
  };
};
