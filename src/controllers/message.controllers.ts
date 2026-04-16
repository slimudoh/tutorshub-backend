import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  deleteUserMessage,
  findMessageById,
  getUserMessages,
  markUserMessageAsRead,
} from "../services/message.services";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById } from "../services/user.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getMessages: RequestHandler = async (
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

    const messages = await getUserMessages(
      userId,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserMessages(
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

export const markMessageAsRead: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { id } = request.params;

    console.log({ id });

    const message = await findMessageById(id);

    if (!message) {
      return response.status(404).json({
        message: "Message not found",
      });
    }

    if (message.receiverId !== userId) {
      return response.status(403).json({
        message: "You are not authorized to perform this action",
      });
    }

    await markUserMessageAsRead(id);

    const updatedMessage = await findMessageById(id);

    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "MARK MESSAGE AS READ",
      oldData: JSON.stringify(message),
      newData: JSON.stringify(updatedMessage),
      section: "MESSAGE",
    });

    response.status(200).json({
      message: "Message marked as read successfully",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const deleteMessage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { id } = request.params;

    const message = await findMessageById(id);

    if (!message) {
      return response.status(404).json({
        message: "Message not found",
      });
    }

    if (message.receiverId !== userId) {
      return response.status(403).json({
        message: "You are not authorized to perform this action",
      });
    }

    await deleteUserMessage(id);

    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "DELETE MESSAGE",
      newData: JSON.stringify(message),
      section: "MESSAGE",
    });

    response.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
