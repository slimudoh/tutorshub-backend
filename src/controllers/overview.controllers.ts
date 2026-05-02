import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  getAdminOverviewData,
  getUserOverviewData,
} from "../services/overview.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getAdminOverview: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const overviewData = await getAdminOverviewData();

    response.status(201).json({
      data: overviewData,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getInstructorOverview: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const overviewData = await getUserOverviewData(userId);

    response.status(201).json({
      data: overviewData,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
