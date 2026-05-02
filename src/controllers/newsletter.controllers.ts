import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import {
  createNewsletter,
  findNewsletterByEmail,
  findNewsletterById,
  getAllSubscribers,
  removeSubscriber,
} from "../services/newsletter.services";
import { createAuditLog } from "../services/auditLog.services";

export const submitNewsletter: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { email } = request.body;

    const newsletterExists = await findNewsletterByEmail(email);

    if (newsletterExists) {
      return response.status(400).json({
        message: "You are already subscribed to our newsletter.",
      });
    }

    const newsletter = await createNewsletter(email);

    await createAuditLog({
      action: "NEWSLETTER",
      newData: JSON.stringify(newsletter),
      section: "NEWSLETTER",
    });

    response.status(201).json({
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
    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const subscribers = await getAllSubscribers(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getAllSubscribers(
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
      return response.status(404).json({
        message: "Subscriber not found.",
      });
    }

    await removeSubscriber(id);

    await createAuditLog({
      action: "NEWSLETTER",
      newData: JSON.stringify(subscriber),
      section: "NEWSLETTER",
    });

    response.status(201).json({
      message: `Subscriber deleted successfully.`,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
