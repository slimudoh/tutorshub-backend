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
      totalUsers: 0,
      totalCourses: 0,
      totalTransactions: 0,
      totalActiveCurrencies: 0,
      courses: 0,
      liveCourses: 0,
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
