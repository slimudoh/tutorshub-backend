import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { ROLES } from "../utils/constant";
import { Users } from "../interfaces/user";
import { ResponseError } from "../interfaces";
import {
  checkUserAccountStatus,
  checkUserEmailVerificationStatus,
  findUserById,
} from "../services/user.services";
import { createServerError } from "../services/error.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

const isInstructor: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const user = (request as CustomRequest).user;

    if (!user?.id) {
      const error = new Error("You are not logged in.") as ResponseError;
      error.statusCode = 401;
      return next(error);
    }

    const authUser = await findUserById(user.id, false);

    if (!authUser?.role) {
      const error = new Error(
        "You are not authorized to view this page.",
      ) as ResponseError;
      error.statusCode = 401;
      return next(error);
    }

    if (
      authUser.role !== ROLES.INSTRUCTOR &&
      authUser.role !== ROLES.ADMIN &&
      authUser.role !== ROLES.SUPER_ADMIN
    ) {
      const error = new Error(
        "You are not authorized to view this page.",
      ) as ResponseError;
      error.statusCode = 401;
      return next(error);
    }

    const accountStatus = await checkUserAccountStatus(authUser.status);
    if (accountStatus.status !== 200) {
      const error = new Error(accountStatus.message) as ResponseError;
      error.statusCode = accountStatus.status;
      return next(error);
    }

    const emailVerificationStatus = await checkUserEmailVerificationStatus(
      authUser.emailVerified,
    );
    if (emailVerificationStatus.status !== 200) {
      const error = new Error(emailVerificationStatus.message) as ResponseError;
      error.statusCode = emailVerificationStatus.status;
      return next(error);
    }

    next();
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export default isInstructor;
