import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError, makeError } from "../services/error.services";
import {
  createReport,
  getReportsById,
  getUserReports,
  updateReportStatus,
} from "../services/report.services";
import {
  createAuditLog,
  createBulkAuditLogs,
} from "../services/auditLog.services";
import { findUserById } from "../services/user.services";
import { REPORT } from "../utils/constant";
import {
  createAdminNotifications,
  createNotification,
} from "../services/notification.services";
import {
  sendAdminEmailMessages,
  sendUserEmailNotification,
} from "../services/email.services";
import {
  paginationHelper,
  removeUnderscoreFromString,
} from "../utils/formatter";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

const VALID_REVIEW_STATUSES = new Set([
  REPORT.UNDER_REVIEW,
  REPORT.RESOLVED,
  REPORT.REJECTED,
]);

export const submitReport: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { report, session, description, date } = request.body;

    const userId = (request as CustomRequest).user?.id;

    const [user, newReport] = await Promise.all([
      findUserById(userId),
      createReport(
        userId,
        report,
        session,
        description,
        date,
        request.file?.filename ?? null,
      ),
    ]);

    const notificationMessage =
      "Thank you for reaching out to us. We have received your report and appreciate you taking the time to contact us. Our team will review your report and get back to you as soon as possible.";

    await Promise.all([
      createNotification(
        "We received your report",
        notificationMessage,
        userId,
      ),
      createAdminNotifications({
        title: "New Report",
        message: `New report from ${user?.firstName + " " + user?.lastName}. Please check the reports section of the admin dashboard for more details.`,
        senderId: null,
      }),
      createAuditLog({
        user: JSON.stringify(user),
        action: "REPORT ISSUE",
        newData: JSON.stringify(newReport),
        section: "REPORT",
      }),
    ]);

    response.status(201).json({ message: "Report logged successfully." });
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
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [reports, totalRecords] = await Promise.all([
      getUserReports(
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
      ),
      getUserReports(keyword as string, status as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
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

    if (!report) {
      return next(makeError("Report not found.", 404));
    }

    response.status(200).json({
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

    if (!VALID_REVIEW_STATUSES.has(status)) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const targetReport = await getReportsById(id);
    if (!targetReport) {
      return next(makeError("Report not found. Please try again later.", 404));
    }

    if (status === targetReport.status) {
      return next(
        makeError(
          "Report is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    const reviewer = (request as CustomRequest).user;

    await updateReportStatus(id, status);

    const notificationMessage = `Your report has been reviewed and the status has been updated to ${removeUnderscoreFromString(status)}. ${comment}`;

    const reportAuthorId = targetReport?.userId || "";

    await Promise.all([
      createNotification(
        "Your report has been reviewed",
        notificationMessage,
        reportAuthorId,
      ),
      createAuditLog({
        user: JSON.stringify(reviewer),
        action: "REVIEW REPORT",
        oldData: JSON.stringify(targetReport),
        newData: JSON.stringify({ ...targetReport, status, comment }),
        section: "REPORT",
      }),
    ]);

    response.status(200).json({ message: "Report reviewed successfully." });

    // sendUserEmailNotification({
    //   emailAddress: targetUser?.emailAddress || "",
    //   userName: targetUser?.firstName || "",
    // });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
