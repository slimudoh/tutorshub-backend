import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  deleteUserNotification,
  findNotificationById,
  getUserNotifications,
  markUserNotificationAsRead,
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

    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const messages = await getUserNotifications(
      userId,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserNotifications(
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
      data: messages,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const markNotificationAsRead: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { id } = request.params;

    console.log({ id });

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

    await markUserNotificationAsRead(id);

    const updatedNotification = await findNotificationById(id);

    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "MARK NOTIFICATION AS READ",
      oldData: JSON.stringify(message),
      newData: JSON.stringify(updatedNotification),
      section: "NOTIFICATION",
    });

    response.status(200).json({
      message: "Notification marked as read successfully",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const deleteNotification: RequestHandler = async (
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

    await deleteUserNotification(id);

    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "DELETE NOTIFICATION",
      newData: JSON.stringify(message),
      section: "NOTIFICATION",
    });

    response.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
