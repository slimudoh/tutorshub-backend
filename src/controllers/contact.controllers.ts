import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import {
  addContactMessage,
  getContactMessageById,
  getContactMessages,
  updateContactMessageStatus,
} from "../services/contact.services";
import { Users } from "../interfaces/user";
import { JwtPayload } from "jsonwebtoken";
import { findUserById } from "../services/user.services";
import { ResponseError } from "../interfaces";
import { createAuditLog } from "../services/auditLog.services";
import { Options } from "nodemailer/lib/mailer";
import { sendMail } from "../services/email.services";
import { APP_NAME, CONTACT, MAIL_CONFIG } from "../utils/constant";
import { createNotification } from "../services/notification.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

type ExtendedOptions = Options & {
  template: string;
  context: Record<string, unknown>;
};

export const createGuestContactMessage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, subject, message } = request.body;

    const contactMessage = await addContactMessage(
      name,
      email,
      subject,
      message,
    );

    await createAuditLog({
      action: "CREATE CONTACT MESSAGE",
      newData: JSON.stringify(contactMessage),
      section: "CONTACT MESSAGE",
    });

    response.status(201).json({
      message: "Message sent successfully",
    });

    const options: ExtendedOptions = {
      from: MAIL_CONFIG.sender,
      to: email,
      subject: `Message from ${APP_NAME}`,
      template: "contact.views",
      context: {
        appName: APP_NAME,
        name,
        email,
        subject,
        message,
        year: new Date().getFullYear(),
      },
    };

    sendMail(options);
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const createUserContactMessage: RequestHandler = async (
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

    const contactMessage = await addContactMessage(
      user.firstName + " " + user.lastName,
      user.emailAddress,
      subject,
      message,
      userId,
    );

    await createAuditLog({
      user: JSON.stringify(user),
      action: "CREATE CONTACT MESSAGE",
      newData: JSON.stringify(contactMessage),
      section: "CONTACT MESSAGE",
    });
    const newNotification = `
        <p>
          Thank you for reaching out to us. We have received your message and appreciate you
          taking the time to contact us. Our team
          will review your inquiry and get back to you as soon as possible.
        </p>
      `;

    await createNotification(
      "New Contact Message",
      newNotification,
      user?.id ?? "",
    );

    await createAuditLog({
      user: JSON.stringify(user),
      action: "NEW NOTIFICATION",
      newData: JSON.stringify({
        title: "New Contact Message",
        message: newNotification,
        receiverId: user?.id ?? "",
        senderId: null,
      }),
      section: "NOTIFICATION",
    });

    response.status(201).json({
      message: "Message sent successfully",
    });

    const options: ExtendedOptions = {
      from: MAIL_CONFIG.sender,
      to: user.emailAddress,
      subject: `Message from ${APP_NAME}`,
      template: "contact.views",
      context: {
        appName: APP_NAME,
        name: user.firstName + " " + user.lastName,
        email: user.emailAddress,
        subject,
        message,
        year: new Date().getFullYear(),
      },
    };

    sendMail(options);
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllContactMessages: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const contactMessages = await getContactMessages(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getContactMessages(
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
      data: contactMessages,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getContactMessage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const contactMessage = await getContactMessageById(id);

    response.status(201).json({
      data: contactMessage,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewContactMessages: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id, status } = request.body;

    const user = (request as CustomRequest).user;

    const targetUser = await findUserById(user?.id);

    if (!targetUser) {
      const error = new Error(
        "Something went wrong. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const targetMessage = await getContactMessageById(id);

    if (!targetMessage) {
      const error = new Error(
        "Message not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (
      status !== CONTACT.RESOLVED &&
      status !== CONTACT.IN_PROGRESS &&
      status !== CONTACT.NEW &&
      status !== CONTACT.CLOSED
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

    await updateContactMessageStatus(id, status);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: status,
      oldData: JSON.stringify(targetMessage),
      newData: JSON.stringify({
        ...targetMessage,
        status: status,
      }),
      section: "REVIEW CONTACT MESSAGE",
    });

    response.status(201).json({
      message: "Message reviewed successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
