import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  createReport,
  getReportsById,
  getUserReports,
  updateReportStatus,
} from "../services/report.services";
import { createAuditLog } from "../services/auditLog.services";
import {
  findUserById,
  getAllActiveAdminUsers,
} from "../services/user.services";
import { ResponseError } from "../interfaces";
import { MAIL_CONFIG, REPORT } from "../utils/constant";
import { createNotification } from "../services/notification.services";
import { sendMultipleMails, sendSingleMail } from "../services/email.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const submitReport: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { report, session, description, date } = request.body;

    const userId = (request as CustomRequest).user?.id;

    const file = request.file;

    const newReport = await createReport(
      userId,
      report,
      session,
      description,
      date,
      file ? file.filename : null,
    );

    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "REPORT ISSUE",
      newData: JSON.stringify(newReport),
      section: "REPORT",
    });

    const newNotification = `
        <p>
          Thank you for reaching out to us. We have received your report and appreciate you
          taking the time to contact us. Our team
          will review your report and get back to you as soon as possible.
        </p>
      `;

    await createNotification("New Report", newNotification, user?.id ?? "");

    await createAuditLog({
      user: JSON.stringify(user),
      action: "NEW NOTIFICATION",
      newData: JSON.stringify({
        title: "New Report",
        message: newNotification,
        receiverId: user?.id ?? "",
        senderId: null,
      }),
      section: "NOTIFICATION",
    });

    response.status(201).json({
      message: ` Report logged successfully. `,
    });

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: user?.emailAddress || "",
      context: {
        title: "We received your report.",
        name: user?.firstName || "",
        message:
          "Thank you for reaching out to us. We have received your report and appreciate you taking the time to contact us. Our team will review your report and get back to you as soon as possible.",
      },
      subject: `We received your report.`,
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
        title: "New Report",
        message: `New report from ${user?.firstName + " " + user?.lastName}. Please check the reports section of the admin dashboard for more details.`,
      },
      subject: `New report from ${user?.firstName + " " + user?.lastName}`,
      template: "adminNotification.views",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllReports: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const reports = await getUserReports(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserReports(
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
      data: reports,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getReport: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const report = await getReportsById(id);

    response.status(201).json({
      data: report,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewReports: RequestHandler = async (
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

    const targetMessage = await getReportsById(id);

    if (!targetMessage) {
      const error = new Error(
        "Report not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (
      status !== REPORT.PENDING &&
      status !== REPORT.UNDER_REVIEW &&
      status !== REPORT.RESOLVED &&
      status !== REPORT.REJECTED
    ) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === targetMessage.status) {
      const error = new Error(
        "Report is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    await updateReportStatus(id, status);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "REVIEW REPORT",
      oldData: JSON.stringify(targetMessage),
      newData: JSON.stringify({
        ...targetMessage,
        status,
        comment,
      }),
      section: "REPORT",
    });

    const newNotification = `
        <p>
          Your report has been reviewed and the status has been updated to ${status}.
        </p>
        <p>${comment}</p>
      `;

    await createNotification(
      "Report Reviewed",
      newNotification,
      targetUser?.id ?? "",
    );

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "NEW NOTIFICATION",
      newData: JSON.stringify({
        title: "Report Reviewed",
        message: newNotification,
        receiverId: targetUser?.id ?? "",
        senderId: null,
      }),
      section: "NOTIFICATION",
    });

    response.status(201).json({
      message: "Report reviewed successfully.",
    });

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: targetUser?.emailAddress || "",
      context: {
        title: "Report Reviewed",
        name: targetUser?.firstName || "",
        message:
          "Your report has been reviewed and the status has been updated to " +
          status +
          "." +
          " " +
          comment,
      },
      subject: `Report Reviewed`,
      template: "userNotification.views",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
