import { RequestHandler, Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { createServerError, makeError } from "../services/error.services";

const validate: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => error.msg)
        .join(", ");

      return next(makeError(message, 422));
    }

    next();
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export default validate;
