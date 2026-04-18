import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { findUserById } from "../services/user.services";
import { createServerError } from "../services/error.services";
import {
  getAdminOverviewData,
  getUserOverviewData,
} from "../services/overview.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getOverview: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const user = await findUserById(userId);

    let overviewData = {
      // admin
      totalUsers: 0,
      totalActiveUsers: 0,
      totalPendingUsers: 0,
      totalSuspendedUsers: 0,
      totalDeactivatedUsers: 0,
      totalActiveCurrencies: 0,
      totalLessons: 0,
      totalActiveLessons: 0,
      totalPendingLessons: 0,
      totalSuspendedLessons: 0,
      totalDeactivatedLessons: 0,
      totalEarnings: 0,
      totalPayouts: 0,
      totalPayments: 0,
      totalSubscribers: 0,
      totalReviews: 0,
      // user
      lesson: 0,
      activeLessons: 0,
      pendingLessons: 0,
      suspendedLessons: 0,
      deactivatedLessons: 0,
      earnings: 0,
      payouts: 0,
      payments: 0,
      subscribers: 0,
      reviews: 0,
    };

    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
      const adminOverviewData = await getAdminOverviewData();
      overviewData = {
        ...overviewData,
        ...adminOverviewData,
      };
    }

    const userOverviewData = await getUserOverviewData(userId);
    overviewData = {
      ...overviewData,
      ...userOverviewData,
    };

    response.status(201).json({
      data: overviewData,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
