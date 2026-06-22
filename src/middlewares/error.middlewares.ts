import { Request, Response, NextFunction } from "express";
import { makeError } from "../services/error.services";

interface AppError {
  statusCode?: number;
  message?: string;
}

export const invalidRouteHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  return next(
    makeError(
      `Route ${request.originalUrl} not found. Please try again or contact support if the problem persists.`,
      404,
    ),
  );
};

export const errorHandler = (
  error: AppError,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  console.error({ error });

  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error?.statusCode ?? 500;
  const errorMessage =
    error?.message ??
    "We are currently experiencing some issues. Please try again or contact support if the problem persists.";

  response.status(statusCode).json({ message: errorMessage });
};
