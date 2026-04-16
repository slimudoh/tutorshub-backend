import { RequestHandler, Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ResponseError } from "../interfaces";
import { createServerError } from "../services/error.services";

const Validate: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg) as ResponseError;
      error.statusCode = 422;
      return next(error);
    }

    next();
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export default Validate;
