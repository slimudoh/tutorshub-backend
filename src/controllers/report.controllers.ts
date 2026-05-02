import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import { createReport } from "../services/report.services";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById } from "../services/user.services";

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

    const newReport = await createReport(
      userId,
      report,
      session,
      description,
      date,
    );

    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "REPORT ISSUE",
      newData: JSON.stringify(newReport),
      section: "REPORT ISSUE",
    });

    response.status(201).json({
      message: ` Report logged successfully. `,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
