import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError, makeError } from "../services/error.services";
import {
  findNotificationById,
  getUserNotifications,
  readAllUserNotifications,
} from "../services/notification.services";
import { paginationHelper } from "../utils/formatter";
import { CustomRequest } from "../types/user";

export const getNotifications: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [messages, totalRecords] = await Promise.all([
      getUserNotifications(userId, offsetSize, newPageSize),
      getUserNotifications(userId) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: messages,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getNotificationById: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { id } = request.params;

    const message = await findNotificationById(id);

    if (!message) {
      return next(makeError("Notification not found.", 404));
    }

    if (message.receiverId !== userId) {
      return next(
        makeError("You are not authorized to perform this action.", 403),
      );
    }

    response.status(200).json({ data: message });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const readAllNotifications: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { pageNumber, pageSize } = request.query;
    const { newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    await readAllUserNotifications(userId, offsetSize, newPageSize);

    response.status(200).json({
      message: "All notifications marked as read successfully",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
