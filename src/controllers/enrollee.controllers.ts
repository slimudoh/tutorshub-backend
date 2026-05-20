import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import { getAdminEnrollees, getEnrollees } from "../services/enrollee.services";

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
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const enrollees = await getAdminEnrollees(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getAdminEnrollees(
      keyword as string,
      status as string,
    );

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
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
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const userId = (request as CustomRequest).user.id;

    const enrollees = await getEnrollees(userId, offsetSize, newPageSize);

    const totalPages = await getEnrollees(userId);

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: enrollees,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
