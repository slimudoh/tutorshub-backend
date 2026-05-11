import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { ResponseError } from "../interfaces";
import { createServerError } from "../services/error.services";
import {
  findLessonById,
  getActiveLessons,
  getAdminLessons,
  getLessonHistories,
  getUserLessons,
  updateLessonStatus,
  fetchLiveLessons,
  getActiveHomeLessons,
  fetchLessonsByCategory,
} from "../services/lesson.services";
import { LESSON } from "../utils/constant";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById } from "../services/user.services";
import { findCategoryBySlug } from "../services/category.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getAllLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const lesson = await getAdminLessons(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getAdminLessons(
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
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewAdminLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { id, status } = request.body;

    const lesson = await findLessonById(id);

    if (!lesson) {
      const error = new Error(
        "Lesson not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (status !== LESSON.ACTIVATE && status !== LESSON.SUSPEND) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === LESSON.PENDING) {
      const error = new Error(
        "Lesson is in PENDING status. You cannot review a pending lesson.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (lesson.status === status) {
      const error = new Error(
        "Lesson is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newStatus =
      status === LESSON.ACTIVATE ? LESSON.ACTIVE : LESSON.SUSPENDED;

    await updateLessonStatus(id, newStatus);

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "REVIEW LESSON",
      oldData: JSON.stringify(lesson),
      newData: JSON.stringify({
        ...lesson,
        status: newStatus,
      }),
      section: "LESSON",
    });

    response.status(201).json({
      message: "Lesson reviewed successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllActiveLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const lesson = await getActiveLessons(
      keyword as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getActiveLessons(keyword as string);

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllUserLessons: RequestHandler = async (
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

    const lesson = await getUserLessons(
      userId,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserLessons(
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
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLiveLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const lesson = await fetchLiveLessons();

    response.status(201).json({
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getMyLessonHistory: RequestHandler = async (
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

    const lessonHistories = await getLessonHistories(
      userId,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getLessonHistories(
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
      data: lessonHistories,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getHomeLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const lesson = await getActiveHomeLessons();

    response.status(201).json({
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLessonsByCategory: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { slug } = request.params;
    const { pageNumber, pageSize, keyword } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const category = await findCategoryBySlug(slug);

    if (!category?.id) {
      const error = new Error("Category not found.") as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const lesson = await fetchLessonsByCategory(
      category.id,
      keyword as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await fetchLessonsByCategory(
      category.id,
      keyword as string,
    );

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
