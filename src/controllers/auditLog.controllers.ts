import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import { getAuditLogs } from "../services/auditLog.services";

export const getAllAuditLogs: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { pageNumber, pageSize, keyword } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const auditLogs = await getAuditLogs(
      keyword as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getAuditLogs(keyword as string);

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: auditLogs,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
