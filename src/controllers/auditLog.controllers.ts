import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import { getAuditLogs } from "../services/auditLog.services";
import { paginationHelper } from "../utils/formatter";

export const getAllAuditLogs: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { pageNumber, pageSize, keyword } = request.query;

    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [auditLogs, totalRecords] = await Promise.all([
      getAuditLogs(keyword as string, offsetSize, newPageSize),
      getAuditLogs(keyword as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: auditLogs,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
