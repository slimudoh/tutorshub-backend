import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { INSTRUCTOR, ROLES } from "../utils/constant";
import { Users } from "../interfaces/user";
import {
  checkUserAccountStatus,
  checkUserEmailVerificationStatus,
  findUserById,
} from "../services/user.services";
import { getInstructorByUserId } from "../services/instructor.services";
import { createServerError, makeError } from "../services/error.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

const isInstructor: RequestHandler = async (
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

    if (
      authUser.role !== ROLES.INSTRUCTOR &&
      authUser.role !== ROLES.ADMIN &&
      authUser.role !== ROLES.SUPER_ADMIN
    ) {
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

    if (!authUser.id) {
      return next(makeError("You are not authorized to view this page.", 401));
    }

    const instructor = await getInstructorByUserId(authUser.id);

    if (!instructor?.userId) {
      return next(
        makeError(
          "You are not an instructor. You have to apply to become an instructor. Please contact the administrator for more information.",
          403,
        ),
      );
    }

    if (instructor.status !== INSTRUCTOR.APPROVED) {
      return next(
        makeError(
          "Your instructor account is not active. Please contact the administrator for more information.",
          403,
        ),
      );
    }

    next();
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export default isInstructor;
