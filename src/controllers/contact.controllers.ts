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
import {
  findUserById,
  getAllActiveAdminUsers,
} from "../services/user.services";
import { ResponseError } from "../interfaces";
import { createAuditLog } from "../services/auditLog.services";
import { sendMultipleMails, sendSingleMail } from "../services/email.services";
import { CONTACT, MAIL_CONFIG } from "../utils/constant";
import { createNotification } from "../services/notification.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

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

    const adminUsers = await getAllActiveAdminUsers();

    await sendMultipleMails({
      from: MAIL_CONFIG.sender,
      dataList: adminUsers.map((adminUser) => {
        return {
          name: adminUser?.firstName || "",
          email: adminUser?.emailAddress || "",
        };
      }),
      context: {
        title: "New contact message",
        message: `New contact message from ${name}. Please check the contact messages section of the admin dashboard for more details.`,
      },
      subject: `New contact message from ${name}`,
      template: "adminNotification.views",
    });
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

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: user.emailAddress,
      context: {
        title: "We received your message.",
        name: user.firstName,
        message:
          "Thank you for reaching out to us. We have received your message and appreciate you taking the time to contact us. Our team will review your inquiry and get back to you as soon as possible.",
      },
      subject: `We received your message.`,
      template: "userNotification.views",
    });

    const adminUsers = await getAllActiveAdminUsers();

    await sendMultipleMails({
      from: MAIL_CONFIG.sender,
      dataList: adminUsers.map((adminUser) => {
        return {
          name: adminUser?.firstName || "",
          email: adminUser?.emailAddress || "",
        };
      }),
      context: {
        title: "New contact message",
        message: `New contact message from ${user.firstName + " " + user.lastName}. Please check the contact messages section of the admin dashboard for more details.`,
      },
      subject: `New contact message from ${user.firstName + " " + user.lastName}`,
      template: "adminNotification.views",
    });
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
      action: "REVIEW CONTACT MESSAGE",
      oldData: JSON.stringify(targetMessage),
      newData: JSON.stringify({
        ...targetMessage,
        status,
        comment,
      }),
      section: "CONTACT MESSAGE",
    });

    const newNotification = `
        <p>
          Your message has been reviewed and the status has been updated to ${status}.
        </p>
        <p>${comment}</p>
      `;

    await createNotification(
      "Contact Message Reviewed",
      newNotification,
      targetUser?.id ?? "",
    );

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "NEW NOTIFICATION",
      newData: JSON.stringify({
        title: "Contact Message Reviewed",
        message: newNotification,
        receiverId: targetUser?.id ?? "",
        senderId: null,
      }),
      section: "NOTIFICATION",
    });

    response.status(201).json({
      message: "Message reviewed successfully.",
    });

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: targetUser?.emailAddress || "",
      context: {
        title: "Message Reviewed",
        name: targetUser?.firstName || "",
        message:
          "Your message has been reviewed and the status has been updated to " +
          status +
          "." +
          " " +
          comment,
      },
      subject: `Message Reviewed`,
      template: "userNotification.views",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
