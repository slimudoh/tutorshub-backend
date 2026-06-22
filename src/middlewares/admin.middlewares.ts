import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { ROLES } from "../utils/constant";
import { Users } from "../interfaces/user";
import {
  checkUserAccountStatus,
  checkUserEmailVerificationStatus,
  findUserById,
} from "../services/user.services";
import { createServerError, makeError } from "../services/error.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

const isAdmin: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = (request as CustomRequest).user;

    if (!user?.id) {
      return next(makeError("You are not logged in.", 401));
    }

    const authUser = await findUserById(user.id, false);

    if (!authUser) {
      return next(makeError("You are not logged in.", 401));
    }

    if (authUser.role !== ROLES.ADMIN && authUser.role !== ROLES.SUPER_ADMIN) {
      return next(makeError("You are not authorized to view this page.", 403));
    }

    const accountStatus = await checkUserAccountStatus(authUser.status);
    if (accountStatus.status !== 200) {
      return next(makeError(accountStatus.message, accountStatus.status));
    }

    const emailVerificationStatus = await checkUserEmailVerificationStatus(
      authUser.emailVerified,
    );
    if (emailVerificationStatus.status !== 200) {
      return next(
        makeError(
          emailVerificationStatus.message,
          emailVerificationStatus.status,
        ),
      );
    }

    next();
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export default isAdmin;
