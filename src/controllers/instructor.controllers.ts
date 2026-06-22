import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError, makeError } from "../services/error.services";
import { findUserById, updateUserRole } from "../services/user.services";
import { INSTRUCTOR, ROLES, SUBSCRIPTION } from "../utils/constant";
import {
  createNewInstructor,
  findInstructorByUserId,
  getAllInstructors,
  getInstructorByUserId,
  updateInstructorStatus,
  updateInstructorProfile,
  fetchActiveInstructors,
  getInstructorById,
  fetchHomeInstructors,
} from "../services/instructor.services";
import {
  createAuditLog,
  createBulkAuditLogs,
} from "../services/auditLog.services";
import {
  sendAdminEmailMessages,
  sendUserEmailNotification,
} from "../services/email.services";
import { createNotification } from "../services/notification.services";
import {
  paginationHelper,
  removeUnderscoreFromString,
} from "../utils/formatter";
import {
  findFreePlan,
  findUsersSubscriptionPlans,
} from "../services/pricing.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

const VALID_INSTRUCTOR_REVIEW_STATUSES = new Set([
  INSTRUCTOR.APPROVED,
  INSTRUCTOR.SUSPENDED,
  INSTRUCTOR.DEACTIVATED,
  INSTRUCTOR.REJECTED,
]);

export const addInstructor: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { bio, languages, skills, experience, links, profession } =
      request.body;
    const userId = (request as CustomRequest).user?.id;

    const [subscriptionPlans, freePlan, instructor] = await Promise.all([
      findUsersSubscriptionPlans(userId),
      findFreePlan(),
      findInstructorByUserId(userId),
    ]);

    if (subscriptionPlans.length === 0) {
      return next(
        makeError(
          "You need a subscription to become an instructor. Please subscribe to a plan and try again.",
          400,
        ),
      );
    }

    const userActiveSubscription = subscriptionPlans.find(
      (plan) => plan.status === SUBSCRIPTION.ACTIVE,
    );

    if (!userActiveSubscription) {
      return next(
        makeError(
          "You do not have an active subscription. Please subscribe to a plan and try again.",
          400,
        ),
      );
    }

    if (freePlan?.id === userActiveSubscription.planId) {
      return next(
        makeError(
          "You already have a free subscription. Please upgrade your subscription to become an instructor.",
          400,
        ),
      );
    }

    if (instructor?.status === INSTRUCTOR.PENDING) {
      return next(
        makeError(
          "Instructor application already exists and is pending review.",
          400,
        ),
      );
    }

    if (instructor?.status === INSTRUCTOR.APPROVED) {
      return next(
        makeError(
          "Instructor application already approved. Please logout and login again for the role to take effect.",
          400,
        ),
      );
    }

    if (instructor?.status === INSTRUCTOR.SUSPENDED) {
      return next(
        makeError(
          "Instructor application has been suspended. Please contact the support team for more information.",
          400,
        ),
      );
    }

    if (instructor?.status === INSTRUCTOR.DEACTIVATED) {
      return next(
        makeError(
          "Instructor application has been deactivated. Please contact the support team for more information.",
          400,
        ),
      );
    }

    const user = await findUserById(userId);
    if (!user) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    const newInstructor = await createNewInstructor(
      userId,
      user?.firstName || "",
      user?.lastName || "",
      bio,
      profession,
      experience,
      languages,
      skills,
      links,
      INSTRUCTOR.PENDING,
    );

    const notificationMessage =
      "Thank you for applying to become an instructor on our platform. We have received your application and appreciate you taking the time to apply. Our team will review your application and get back to you as soon as possible.";

    await Promise.all([
      createAuditLog({
        user: JSON.stringify(user),
        action: "CREATE INSTRUCTOR",
        oldData: JSON.stringify(instructor),
        newData: JSON.stringify(newInstructor),
        section: "INSTRUCTOR",
      }),
      createNotification(
        "New Instructor Application",
        notificationMessage,
        userId,
      ),
    ]);

    response.status(201).json({
      message:
        "Instructor created successfully. We will get back to you as soon as possible.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const updateInstructor: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { bio, languages, skills, experience, links, profession } =
      request.body;
    const userId = (request as CustomRequest).user?.id;

    const [user, instructor] = await Promise.all([
      findUserById(userId),
      findInstructorByUserId(userId),
    ]);

    if (!instructor) {
      return next(
        makeError("You are not an instructor to carry out this action.", 403),
      );
    }

    if (instructor.status !== INSTRUCTOR.APPROVED) {
      return next(
        makeError(
          "Your instructor account is not approved. Please contact the support team for more information.",
          403,
        ),
      );
    }

    if (!user) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    const profileUpdates = {
      bio,
      profession,
      experience,
      languages,
      skills,
      links,
    };

    await updateInstructorProfile(
      userId,
      user?.firstName || "",
      user?.lastName || "",
      bio,
      profession,
      experience,
      languages,
      skills,
      links,
    );

    await createAuditLog({
      user: JSON.stringify(user),
      action: "UPDATE INSTRUCTOR",
      oldData: JSON.stringify(instructor),
      newData: JSON.stringify({ ...instructor, ...profileUpdates }),
      section: "INSTRUCTOR",
    });

    const updatedInstructor = await findInstructorByUserId(userId);

    response.status(200).json({
      message: "Instructor profile updated successfully.",
      data: { instructor: updatedInstructor },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getInstructors: RequestHandler = async (
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

    const [instructors, totalRecords] = await Promise.all([
      getAllInstructors(
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
      ),
      getAllInstructors(keyword as string, status as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: instructors,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getInstructor: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const instructor = await getInstructorByUserId(id);

    if (!instructor?.userId) {
      return next(makeError("Instructor not found.", 404));
    }

    const user = await findUserById(instructor.userId);
    instructor.user = user;

    response.status(200).json({ data: instructor });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewInstructors: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id, status, comment } = request.body;

    const reviewerId = (request as CustomRequest).user?.id;

    if (!VALID_INSTRUCTOR_REVIEW_STATUSES.has(status)) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const [targetInstructor, reviewer] = await Promise.all([
      getInstructorById(id),
      findUserById(reviewerId),
    ]);

    if (!targetInstructor?.userId) {
      return next(
        makeError("Instructor not found. Please try again later.", 404),
      );
    }

    if (status === targetInstructor.status) {
      return next(
        makeError(
          "Instructor is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    const newRole =
      status === INSTRUCTOR.APPROVED ? ROLES.INSTRUCTOR : ROLES.USER;

    await Promise.all([
      updateInstructorStatus(id, status),
      updateUserRole(targetInstructor.userId, newRole),
    ]);

    const notificationMessage = `Your instructor application has been reviewed and the status has been updated to ${removeUnderscoreFromString(status)}. ${comment}`;

    await Promise.all([
      createNotification(
        "Your instructor application has been reviewed",
        notificationMessage,
        targetInstructor.userId,
      ),
      createAuditLog({
        user: JSON.stringify(reviewer),
        action: "REVIEW INSTRUCTOR",
        oldData: JSON.stringify(targetInstructor),
        newData: JSON.stringify({ ...targetInstructor, status, comment }),
        section: "INSTRUCTOR",
      }),
    ]);

    response
      .status(200)
      .json({ message: "Instructor application reviewed successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getActiveInstructors: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [instructors, totalRecords] = await Promise.all([
      fetchActiveInstructors(keyword as string, offsetSize, newPageSize),
      fetchActiveInstructors(keyword as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: instructors,
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

    response.status(200).json({
      data: users,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
