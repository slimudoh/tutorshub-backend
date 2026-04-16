import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { ResponseError } from "../interfaces";
import { createServerError } from "../services/error.services";
import {
  findCourseById,
  getActiveCourses,
  getAdminCourses,
  getCourseHistories,
  getUserCourses,
  updateCourseStatus,
  getLiveCourses,
} from "../services/course.services";
import { STATUS } from "../utils/constant";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById } from "../services/user.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getAllCourses: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const courses = await getAdminCourses(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getAdminCourses(
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
      data: courses,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewAdminCourses: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { id, status } = request.body;

    const course = await findCourseById(id);

    if (!course) {
      const error = new Error(
        "Course not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (status !== STATUS.ACTIVATE && status !== STATUS.SUSPEND) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === STATUS.PENDING) {
      const error = new Error(
        "Course is in PENDING status. You cannot review a pending course.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (course.status === status) {
      const error = new Error(
        "Course is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newStatus =
      status === STATUS.ACTIVATE ? STATUS.ACTIVE : STATUS.SUSPENDED;

    await updateCourseStatus(id, newStatus);

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: newStatus,
      oldData: JSON.stringify(course),
      newData: JSON.stringify({
        ...course,
        status: newStatus,
      }),
      section: "REVIEW COURSE",
    });

    response.status(201).json({
      message: "Course reviewed successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllActiveCourses: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const courses = await getActiveCourses(
      keyword as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getActiveCourses(keyword as string);

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: courses,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllUserCourses: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const courses = await getUserCourses(
      userId,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserCourses(
      userId,
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
      data: courses,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLiveSessionsCourses: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const courses = await getLiveCourses();

    response.status(201).json({
      data: courses,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getMyCourseHistory: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const courseHistories = await getCourseHistories(
      userId,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getCourseHistories(
      userId,
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
      data: courseHistories,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
