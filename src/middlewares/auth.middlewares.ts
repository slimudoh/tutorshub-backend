import { RequestHandler, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import BlackListToken from "../models/blackListToken.models";
import { createServerError, makeError } from "../services/error.services";
import { CustomRequest, IJwtPayload } from "../types/user";

const isAuth: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = request.header("Authorization");
    const token = authHeader?.split(" ")[1] ?? null;

    if (!token) {
      return next(makeError("Please login to continue.", 401));
    }

    const checkIfBlacklisted = await BlackListToken.findOne({
      where: { token },
    });

    if (checkIfBlacklisted) {
      return next(makeError("This session has expired. Please login", 401));
    }

    let decodedToken: IJwtPayload;

    try {
      decodedToken = jwt.verify(
        token,
        process.env.TOKEN_SECRET!,
      ) as IJwtPayload;
    } catch (jwtErr) {
      if (jwtErr instanceof jwt.TokenExpiredError) {
        return next(
          makeError("Your session has expired. Please login again.", 401),
        );
      }
      if (jwtErr instanceof jwt.JsonWebTokenError) {
        return next(
          makeError("You are not authorized to view this page.", 401),
        );
      }
      throw jwtErr;
    }

    (request as CustomRequest).user = decodedToken;
    next();
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export default isAuth;
