import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import {
  addMessage,
  getMessageById,
  getMessages,
  updateMessageStatus,
} from "../services/message.services";
import { Users } from "../interfaces/user";
import { JwtPayload } from "jsonwebtoken";
import { findUserById } from "../services/user.services";
import { ResponseError } from "../interfaces";
import { createAuditLog } from "../services/auditLog.services";
import {
  sendAdminEmailMessages,
  sendSingleMail,
  sendUserEmailNotification,
} from "../services/email.services";
import { MESSAGE, MAIL_CONFIG } from "../utils/constant";
import { createNotification } from "../services/notification.services";
import { removeUnderscoreFromString } from "../utils/formatter";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const createGuestMessage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, subject, message } = request.body;

    const msg = await addMessage(name, email, subject, message);

    await createAuditLog({
      action: "CREATE MESSAGE",
      newData: JSON.stringify(msg),
      section: "MESSAGE",
    });

    response.status(201).json({
      message: "Message sent successfully",
    });

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: email,
      context: {
        title: "We received your message.",
        name,
        message:
          "Thank you for reaching out to us. We have received your message and appreciate you taking the time to contact us. Our team will review your inquiry and get back to you as soon as possible.",
      },
      subject: `We received your message.`,
      template: "userNotification.views",
    });

    sendAdminEmailMessages({
      title: "New Message",
      message: `New message from ${name}. Please check the messages section of the admin dashboard for more details.`,
      subject: `New message from ${name}`,
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
      const error = new Error(
        "Something went wrong. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const msg = await addMessage(
      user.firstName + " " + user.lastName,
      user.emailAddress,
      subject,
      message,
      userId,
    );

    await createAuditLog({
      user: JSON.stringify(user),
      action: "CREATE MESSAGE",
      newData: JSON.stringify(msg),
      section: "MESSAGE",
    });

    const newNotification = `Thank you for reaching out to us. We have received your message and appreciate you taking the time to contact us. Our team will review your inquiry and get back to you as soon as possible.`;

    await createNotification(
      "We received your message",
      newNotification,
      user?.id ?? "",
    );

    await createAuditLog({
      user: JSON.stringify(user),
      action: "NEW NOTIFICATION",
      newData: JSON.stringify({
        title: "We received your message",
        message: newNotification,
        receiverId: user?.id ?? "",
        senderId: null,
      }),
      section: "NOTIFICATION",
    });

    response.status(201).json({
      message: "Message sent successfully",
    });

    sendUserEmailNotification({
      emailAddress: user.emailAddress,
      userName: user.firstName + " " + user.lastName,
    });

    sendAdminEmailMessages({
      title: "New Message",
      message: `New message from ${user.firstName + " " + user.lastName}. Please check the messages section of the admin dashboard for more details.`,
      subject: `New message from ${user.firstName + " " + user.lastName}`,
    });
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
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const messages = await getMessages(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getMessages(keyword as string, status as string);

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

export const getMessage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const message = await getMessageById(id);

    response.status(201).json({
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

    const user = (request as CustomRequest).user;

    const targetUser = await findUserById(user?.id);

    if (!targetUser) {
      const error = new Error(
        "Something went wrong. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const targetMessage = await getMessageById(id);

    if (!targetMessage) {
      const error = new Error(
        "Message not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (
      status !== MESSAGE.RESOLVED &&
      status !== MESSAGE.IN_PROGRESS &&
      status !== MESSAGE.NEW &&
      status !== MESSAGE.CLOSED
    ) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === targetMessage.status) {
      const error = new Error(
        "Message is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    await updateMessageStatus(id, status);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "REVIEW MESSAGE",
      oldData: JSON.stringify(targetMessage),
      newData: JSON.stringify({
        ...targetMessage,
        status,
        comment,
      }),
      section: "MESSAGE",
    });

    const newNotification = `Your message has been reviewed and the status has been updated to ${removeUnderscoreFromString(status)}. ${comment}`;

    await createNotification(
      "Your message has been reviewed",
      newNotification,
      targetUser?.id ?? "",
    );

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "NEW NOTIFICATION",
      newData: JSON.stringify({
        title: "Your message has been reviewed",
        message: newNotification,
        receiverId: targetUser?.id ?? "",
        senderId: null,
      }),
      section: "NOTIFICATION",
    });

    response.status(201).json({
      message: "Message reviewed successfully.",
    });

    sendUserEmailNotification({
      emailAddress: targetUser?.emailAddress || "",
      userName: targetUser?.firstName || "",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
