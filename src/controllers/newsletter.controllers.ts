import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError, makeError } from "../services/error.services";
import {
  createNewsletter,
  findNewsletterByEmail,
  findNewsletterById,
  getAllSubscribers,
  removeSubscriber,
} from "../services/newsletter.services";
import { createAuditLog } from "../services/auditLog.services";
import { paginationHelper } from "../utils/formatter";

export const submitNewsletter: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { email } = request.body;

    const existing = await findNewsletterByEmail(email);
    if (existing) {
      return next(
        makeError("You are already subscribed to our newsletter.", 400),
      );
    }

    const newsletter = await createNewsletter(email);

    await createAuditLog({
      action: "SUBSCRIBE",
      newData: JSON.stringify(newsletter),
      section: "NEWSLETTER",
    });
    response.status(200).json({
      message: ` Report logged successfully. `,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getSubscribers: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [subscribers, totalRecords] = await Promise.all([
      getAllSubscribers(keyword as string, offsetSize, newPageSize),
      getAllSubscribers(keyword as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: subscribers,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const deleteSubscriber: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const subscriber = await findNewsletterById(id);
    if (!subscriber) {
      return next(makeError("Subscriber not found.", 404));
    }

    await removeSubscriber(id);

    await createAuditLog({
      action: "DELETE SUBSCRIBER",
      oldData: JSON.stringify(subscriber),
      section: "NEWSLETTER",
    });

    response.status(200).json({
      message: `Subscriber deleted successfully.`,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
