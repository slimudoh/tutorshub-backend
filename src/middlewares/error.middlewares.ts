import { Request, Response, NextFunction } from "express";
import { ResponseError } from "../interfaces";

interface Error {
  statusCode?: number;
  message?: string;
}

export const invalidRouteHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const error = new Error(
    `Route ${request.baseUrl + request.path} not found. Please try again or contact support if the problem persists.`,
  ) as ResponseError;
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  console.log({ error });

  let newError = error?.message;

  const statusCode = error?.statusCode ?? 500;
  const message =
    newError ??
    "We are currently experiencing some issues. Please try again or contact support if the problem persists.";
  response.status(statusCode).json({ message });
};
