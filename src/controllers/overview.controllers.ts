import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import {
  getAdminOverviewData,
  getUserOverviewData,
} from "../services/overview.services";
import { CustomRequest } from "../types/user";

export const getAdminOverview: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const overviewData = await getAdminOverviewData();

    response.status(200).json({
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

    response.status(200).json({
      data: overviewData,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
