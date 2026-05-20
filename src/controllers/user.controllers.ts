import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { ResponseError } from "../interfaces";
import {
  deleteUser,
  findUserById,
  getDeletedUser,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  updateUserStatus,
  verifyUserPassword,
  fetchHomeInstructors,
} from "../services/user.services";
import { createServerError } from "../services/error.services";
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
import { findInstructorByUserId } from "../services/instructor.services";
import Instructor from "../models/instructor.models";

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
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const users = await getAllUsers(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getAllUsers(keyword as string, status as string);

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
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
    const userCurrency = await getUserCurrency(request);

    if (user) {
      user.deactivationDetails = await getDeletedUser(userId);
      const subscriptionPlans = await findUsersSubscriptionPlans(userId);

      const subscriptionPlan = subscriptionPlans.find(
        (plan) => plan.status === SUBSCRIPTION.ACTIVE,
      );

      if (subscriptionPlan?.planId) {
        let pricingPlan = await findPricingPlanById(subscriptionPlan.planId);

        pricingPlan = await convertSingleCurrency(
          pricingPlan,
          userCurrency || "USD",
        );

        subscriptionPlan.plan = pricingPlan;
      }

      user.subscriptionPlan = subscriptionPlan ?? null;
    }

    response.status(201).json({
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

    const userProfile = await findUserById(userId);

    if (!userProfile) {
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const userCurrency = await getUserCurrency(request);
    const learner = getUserProfile(userProfile);
    const instructor = await findInstructorByUserId(userId);

    response.status(201).json({
      data: {
        learner,
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

    response.status(201).json({
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

    const targetUser = await findUserById(id);

    if (!targetUser) {
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (
      targetUser.role === ROLES.ADMIN ||
      targetUser.role === ROLES.SUPER_ADMIN
    ) {
      const error = new Error(
        "You cannot review an admin user. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status !== USER.ACTIVATE && status !== USER.SUSPEND) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === USER.PENDING) {
      const error = new Error(
        "User is in PENDING status. You cannot review a pending user.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (targetUser.status === status) {
      const error = new Error(
        "User is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newStatus = status === USER.ACTIVATE ? USER.ACTIVE : USER.SUSPENDED;

    await updateUserStatus(id, newStatus);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "REVIEW USER",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify({
        ...targetUser,
        status: newStatus,
      }),
      section: "USER",
    });

    response.status(201).json({
      message: "User reviewed successfully.",
    });
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
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (!targetUser.avatar) {
      const error = new Error(
        "User avatar not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    await deleteFile(targetUser.avatar);

    await updateUserProfile(user.id, {
      avatar: null,
    });

    const userProfile = await findUserById(user.id);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "REMOVE AVATAR",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify(userProfile),
      section: "USER",
    });

    if (!userProfile) {
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const profile = getUserProfile(userProfile);

    response.status(201).json({
      message: "User avatar removed successfully.",
      data: {
        ...profile,
      },
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
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    await updateUserProfile(user.id, {
      firstName,
      lastName,
      phoneCode,
      phoneNumber,
      profession,
      userName,
      dateOfBirth,
      address,
      country,
    });

    const userProfile = await findUserById(user.id);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "UPDATE PROFILE",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify(userProfile),
      section: "USER",
    });

    if (!userProfile) {
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const learner = getUserProfile(userProfile);

    response.status(201).json({
      message: "User profile updated successfully.",
      data: {
        learner,
      },
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

    const targetUser = await findUserById(user.id);

    if (!targetUser) {
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (targetUser?.avatar) {
      await deleteFile(targetUser.avatar);
    }

    const file = request.file;

    if (!file) {
      const error = new Error(
        "File is required. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    await updateUserProfile(user.id, {
      avatar: file.filename,
    });

    const userProfile = await findUserById(user.id);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "UPDATE AVATAR",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify(userProfile),
      section: "USER",
    });

    if (!userProfile) {
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const profile = getUserProfile(userProfile);

    response.status(201).json({
      message: "User avatar updated successfully.",
      data: {
        ...profile,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getUserAvatar: RequestHandler = async (
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
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const isPasswordValid = await verifyUserPassword(
      password,
      targetUser.password,
    );

    if (!isPasswordValid) {
      const error = new Error(
        "Invalid password. Please try again later.",
      ) as ResponseError;
      error.statusCode = 401;
      return next(error);
    }

    await deleteUser(userId, reason, description);

    const userProfile = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "DELETE USER",
      oldData: JSON.stringify(targetUser),
      newData: JSON.stringify({
        ...userProfile,
        reason,
        description,
      }),
      section: "USER",
    });

    if (!userProfile) {
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const profile = getUserProfile(userProfile);

    response.status(201).json({
      message: "User deleted successfully.",
      data: {
        ...profile,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getHomeInstructors: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const users = await fetchHomeInstructors();

    response.status(201).json({
      data: users,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
