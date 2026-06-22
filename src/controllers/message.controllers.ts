import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError, makeError } from "../services/error.services";
import {
  addMessage,
  getMessageById,
  getMessages,
  updateMessageStatus,
} from "../services/message.services";
import { Users } from "../interfaces/user";
import { JwtPayload } from "jsonwebtoken";
import { findUserById } from "../services/user.services";
import {
  createAuditLog,
  createBulkAuditLogs,
} from "../services/auditLog.services";
import {
  sendAdminEmailMessages,
  sendSingleMail,
  sendUserEmailNotification,
} from "../services/email.services";
import { MESSAGE, MAIL_CONFIG } from "../utils/constant";
import {
  createAdminNotifications,
  createBulkNotifications,
  createNotification,
} from "../services/notification.services";
import {
  paginationHelper,
  removeUnderscoreFromString,
} from "../utils/formatter";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

const VALID_REVIEW_STATUSES = new Set([
  MESSAGE.RESOLVED,
  MESSAGE.IN_PROGRESS,
  MESSAGE.CLOSED,
]);

export const createGuestMessage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, subject, message } = request.body;

    const msg = await addMessage(name, email, subject, message);

    await Promise.all([
      createAdminNotifications({
        title: "New Message",
        message: `New message from ${name}. Please check the messages section of the admin dashboard for more details.`,
        senderId: null,
      }),
      createAuditLog({
        action: "CREATE MESSAGE",
        newData: JSON.stringify(msg),
        section: "MESSAGE",
      }),
    ]);

    response.status(200).json({
      message: "Message sent successfully",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const createUserMessage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { subject, message } = request.body;
    const userId = (request as CustomRequest).user?.id;

    const user = await findUserById(userId);

    if (!user?.emailAddress) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    const msg = await addMessage(
      `${user.firstName} ${user.lastName}`,
      user.emailAddress,
      subject,
      message,
      userId,
    );

    const notificationMessage =
      "Thank you for reaching out to us. We have received your message and appreciate you taking the time to contact us. Our team will review your inquiry and get back to you as soon as possible.";

    await Promise.all([
      createNotification(
        "We received your message",
        notificationMessage,
        userId,
      ),
      createAdminNotifications({
        title: "New Message",
        message: `New message from ${user.firstName + " " + user.lastName}. Please check the messages section of the admin dashboard for more details.`,
        senderId: null,
      }),
      createAuditLog({
        user: JSON.stringify(user),
        action: "CREATE MESSAGE",
        newData: JSON.stringify(msg),
        section: "MESSAGE",
      }),
    ]);
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllMessages: RequestHandler = async (
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

    const [messages, totalRecords] = await Promise.all([
      getMessages(keyword as string, status as string, offsetSize, newPageSize),
      getMessages(keyword as string, status as string) as Promise<number>,
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

export const getMessage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const message = await getMessageById(id);

    if (!message) {
      return next(makeError("Message not found.", 404));
    }

    response.status(200).json({
      data: message,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewMessages: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id, status, comment } = request.body;

    if (!VALID_REVIEW_STATUSES.has(status)) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const targetMessage = await getMessageById(id);
    if (!targetMessage) {
      return next(makeError("Message not found. Please try again later.", 404));
    }

    if (status === targetMessage.status) {
      return next(
        makeError(
          "Message is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    const reviewerId = (request as CustomRequest).user?.id;

    const [, reviewer] = await Promise.all([
      updateMessageStatus(id, status),
      findUserById(reviewerId),
    ]);

    const notificationMessage = `Your message has been reviewed and the status has been updated to ${removeUnderscoreFromString(status)}. ${comment}`;

    const messageAuthorId = targetMessage?.userId ?? "";

    await Promise.all([
      createNotification(
        "Your message has been reviewed",
        notificationMessage,
        messageAuthorId,
      ),
      createAuditLog({
        user: JSON.stringify(reviewer),
        action: "REVIEW MESSAGE",
        oldData: JSON.stringify(targetMessage),
        newData: JSON.stringify({ ...targetMessage, status, comment }),
        section: "MESSAGE",
      }),
    ]);

    response.status(200).json({ message: "Message reviewed successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
