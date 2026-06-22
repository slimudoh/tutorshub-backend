import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  getAdminEnrollees,
  getEnrollees,
  fetchLessonEnrollees,
} from "../services/enrollee.services";
import { paginationHelper } from "../utils/formatter";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getAllEnrollees: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize, status } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [enrollees, totalRecords] = await Promise.all([
      getAdminEnrollees(
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
      ),
      getAdminEnrollees(keyword as string, status as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: enrollees,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getUserEnrollees: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const userId = (request as CustomRequest).user.id;

    const [enrollees, totalRecords] = await Promise.all([
      getEnrollees(userId, offsetSize, newPageSize),
      getEnrollees(userId) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: enrollees,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLessonEnrollees: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const enrollees = await fetchLessonEnrollees(id);

    response.status(200).json({
      data: enrollees,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
