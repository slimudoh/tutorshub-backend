import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  findNotificationById,
  getUserNotifications,
  readAllUserNotifications,
} from "../services/notification.services";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById } from "../services/user.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getNotifications: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { pageNumber, pageSize } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const messages = await getUserNotifications(
      userId,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserNotifications(userId);

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
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
      return response.status(404).json({
        message: "Notification not found",
      });
    }

    if (message.receiverId !== userId) {
      return response.status(403).json({
        message: "You are not authorized to perform this action",
      });
    }

    response.status(200).json({
      data: message,
    });
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
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    await readAllUserNotifications(userId, offsetSize, newPageSize);

    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "READ ALL NOTIFICATIONS",
      section: "NOTIFICATION",
    });

    response.status(200).json({
      message: "All notifications marked as read successfully",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
