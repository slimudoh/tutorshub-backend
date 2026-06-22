import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import {
  deleteUser,
  findUserById,
  getDeletedUser,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  updateUserStatus,
  verifyUserPassword,
} from "../services/user.services";
import { createServerError, makeError } from "../services/error.services";
import { createAuditLog } from "../services/auditLog.services";
import { ROLES, SUBSCRIPTION, USER } from "../utils/constant";
import path from "path";
import {
  findPricingPlanById,
  findUsersSubscriptionPlans,
} from "../services/pricing.services";
import {
  convertSingleCurrency,
  getUserCurrency,
} from "../services/currency.services";
import { deleteFile } from "../utils/file";
import {
  findInstructorByUserId,
  updateInstructorNames,
} from "../services/instructor.services";
import { paginationHelper } from "../utils/formatter";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getUsers: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize, status } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [users, totalRecords] = await Promise.all([
      getAllUsers(keyword as string, status as string, offsetSize, newPageSize),
      getAllUsers(keyword as string, status as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: users,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getUser: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = request.params.id;
    const user = await findUserById(userId);

    if (!user) {
      return next(makeError("User not found.", 404));
    }

    const [userCurrency, subscriptionPlans, deactivationDetails] =
      await Promise.all([
        getUserCurrency(request),
        findUsersSubscriptionPlans(userId),
        getDeletedUser(userId),
      ]);

    user.deactivationDetails = deactivationDetails;

    const activeSubscription = subscriptionPlans.find(
      (plan) => plan.status === SUBSCRIPTION.ACTIVE,
    );

    if (activeSubscription?.planId) {
      let pricingPlan = await findPricingPlanById(activeSubscription.planId);
      const { amount, currency } = await convertSingleCurrency(
        {
          amount: pricingPlan?.amount,
          currency: pricingPlan?.currency,
        },
        userCurrency,
      );
      const { amount: amountPerSession } = await convertSingleCurrency(
        {
          amount: pricingPlan?.amountPerSession,
          currency: pricingPlan?.currency,
        },
        userCurrency,
      );

      if (pricingPlan) {
        pricingPlan.amount = amount;
        pricingPlan.amountPerSession = amountPerSession;
        pricingPlan.currency = currency;
      }

      activeSubscription.plan = pricingPlan;
    }

    user.subscriptionPlan = activeSubscription ?? null;

    response.status(200).json({ data: user });

    response.status(200).json({
      data: user,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getProfile: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const [userProfile, userCurrency, instructor] = await Promise.all([
      findUserById(userId),
      getUserCurrency(request),
      findInstructorByUserId(userId),
    ]);

    if (!userProfile) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    response.status(200).json({
      data: {
        learner: getUserProfile(userProfile),
        currency: userCurrency,
        instructor,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getCurrency: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userCurrency = await getUserCurrency(request);

    response.status(200).json({
      data: userCurrency,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewUsers: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id, status } = request.body;

    if (status !== USER.ACTIVATE && status !== USER.SUSPEND) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const targetUser = await findUserById(id);

    if (!targetUser) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    if (
      targetUser.role === ROLES.ADMIN ||
      targetUser.role === ROLES.SUPER_ADMIN
    ) {
      return next(
        makeError(
          "You cannot review an admin user. Please try again later.",
          400,
        ),
      );
    }

    const newStatus = status === USER.ACTIVATE ? USER.ACTIVE : USER.SUSPENDED;

    if (targetUser.status === newStatus) {
      return next(
        makeError(
          "User is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    await updateUserStatus(id, newStatus);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "REVIEW USER",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify({ ...targetUser, status: newStatus }),
      section: "USER",
    });

    response.status(200).json({ message: "User reviewed successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const removeAvatar: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const user = (request as CustomRequest).user;
    const targetUser = await findUserById(user.id);

    if (!targetUser) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    if (!targetUser.avatar) {
      return next(
        makeError("User avatar not found. Please try again later.", 404),
      );
    }

    await deleteFile(targetUser.avatar);
    await updateUserProfile(user.id, { avatar: null });

    const updatedSnapshot = { ...targetUser, avatar: null };

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "REMOVE AVATAR",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify(updatedSnapshot),
      section: "USER",
    });

    const profile = getUserProfile(updatedSnapshot as typeof targetUser);

    response.status(200).json({
      message: "User avatar removed successfully.",
      data: { ...profile },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const updateProfile: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const user = (request as CustomRequest).user;

    const {
      firstName,
      lastName,
      phoneCode,
      phoneNumber,
      profession,
      userName,
      dateOfBirth,
      address,
      country,
    } = request.body;

    const targetUser = await findUserById(user.id);

    if (!targetUser) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    const profileUpdates = {
      firstName,
      lastName,
      phoneCode,
      phoneNumber,
      profession,
      userName,
      dateOfBirth,
      address,
      country,
    };

    await updateUserProfile(user.id, profileUpdates);

    const instructor = await findInstructorByUserId(user.id);

    if (instructor) {
      await updateInstructorNames(user.id, firstName, lastName);
      await createAuditLog({
        user: JSON.stringify(targetUser),
        action: "UPDATE INSTRUCTOR PROFILE",
        oldData: JSON.stringify(instructor),
        newData: JSON.stringify({ ...instructor, firstName, lastName }),
        section: "INSTRUCTOR",
      });
    }

    const updatedSnapshot = { ...targetUser, ...profileUpdates };

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "UPDATE PROFILE",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify(updatedSnapshot),
      section: "USER",
    });

    response.status(200).json({
      message: "User profile updated successfully.",
      data: { learner: getUserProfile(updatedSnapshot as typeof targetUser) },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const updateAvatar: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const user = (request as CustomRequest).user;

    const file = request.file;
    if (!file) {
      return next(makeError("File is required. Please try again later.", 400));
    }

    const targetUser = await findUserById(user.id);
    if (!targetUser) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    if (targetUser.avatar) {
      await deleteFile(targetUser.avatar);
    }

    await updateUserProfile(user.id, { avatar: file.filename });

    const updatedSnapshot = { ...targetUser, avatar: file.filename };

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "UPDATE AVATAR",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify(updatedSnapshot),
      section: "USER",
    });

    const profile = getUserProfile(updatedSnapshot as typeof targetUser);

    response.status(200).json({
      message: "User avatar updated successfully.",
      data: { ...profile },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getImage: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const filePath = path.join(__dirname, "../../uploads", request.params.name);
    response.sendFile(filePath);
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const deleteUsers: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { password, reason, description } = request.body;

    const targetUser = await findUserById(userId, false);

    if (!targetUser?.password) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    const isPasswordValid = await verifyUserPassword(
      password,
      targetUser.password,
    );
    if (!isPasswordValid) {
      return next(makeError("Invalid password. Please try again later.", 401));
    }

    await deleteUser(userId, reason, description);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "DELETE USER",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify({
        ...targetUser,
        reason,
        description,
        deleted: true,
      }),
      section: "USER",
    });

    const profile = getUserProfile(targetUser);

    response.status(200).json({
      message: "Your account has been deleted successfully.",
      data: { ...profile },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
