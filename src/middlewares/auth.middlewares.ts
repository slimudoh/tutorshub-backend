import { RequestHandler, Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import BlackListToken from "../models/blackListToken.models";
import { Users } from "../interfaces/user";
import { ResponseError } from "../interfaces";
import { createServerError } from "../services/error.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

interface IJwtPayload extends JwtPayload {
  user: Users | JwtPayload;
}

const isAuth: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const token = request.header("Authorization")
      ? request.header("Authorization")?.split(" ")[1]
      : null;

    if (!token) {
      const error = new Error("Please login to continue.") as ResponseError;
      error.statusCode = 401;
      return next(error);
    }

    const checkIfBlacklisted = await BlackListToken.findOne({
      where: { token },
    });

    if (checkIfBlacklisted) {
      const error = new Error(
        "This session has expired. Please login",
      ) as ResponseError;
      error.statusCode = 401;
      return next(error);
    }

    const decodedToken = <IJwtPayload>(
      jwt.verify(token, process.env.TOKEN_SECRET!)
    );

    if (!decodedToken) {
      const error = new Error(
        "You are not authorized to view this page.",
      ) as ResponseError;
      error.statusCode = 401;
      return next(error);
    }

    (request as CustomRequest).user = decodedToken;
    next();
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export default isAuth;
