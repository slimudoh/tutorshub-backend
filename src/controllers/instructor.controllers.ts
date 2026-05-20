import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import { findUserById, updateUserRole } from "../services/user.services";
import { ResponseError } from "../interfaces";
import { INSTRUCTOR, ROLES } from "../utils/constant";
import {
  createNewInstructor,
  findInstructorByUserId,
  getAllInstructors,
  getInstructorById,
  updateInstructorStatus,
  updateInstructorProfile,
} from "../services/instructor.services";
import { createAuditLog } from "../services/auditLog.services";
import {
  sendAdminEmailMessages,
  sendUserEmailNotification,
} from "../services/email.services";
import { createNotification } from "../services/notification.services";
import { removeUnderscoreFromString } from "../utils/formatter";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const addInstructor: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { bio, languages, skills } = request.body;

    const userId = (request as CustomRequest).user?.id;

    const user = await findUserById(userId);

    if (user?.role !== ROLES.USER) {
      const error = new Error(
        "You are not authorized to perform this action",
      ) as ResponseError;
      error.statusCode = 403;
      return next(error);
    }

    const instructor = await findInstructorByUserId(userId);

    if (instructor?.status === INSTRUCTOR.PENDING) {
      const error = new Error(
        "Instructor application already exists and is pending review.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (instructor?.status === INSTRUCTOR.APPROVED) {
      const error = new Error(
        "Instructor application already approved.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (instructor?.status === INSTRUCTOR.SUSPENDED) {
      const error = new Error(
        "Instructor application has been suspended. Please contact the support team for more information.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (instructor?.status === INSTRUCTOR.DEACTIVATED) {
      const error = new Error(
        "Instructor application has been deactivated. Please contact the support team for more information.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newInstructor = await createNewInstructor(
      userId,
      bio,
      languages,
      skills,
      INSTRUCTOR.PENDING,
    );

    await createAuditLog({
      user: JSON.stringify(user),
      action: "CREATE INSTRUCTOR",
      oldData: JSON.stringify(instructor),
      newData: JSON.stringify(newInstructor),
      section: "INSTRUCTOR",
    });

    const newNotification = `Thank you for applying to become an instructor on our platform. We have received your application and appreciate you taking the time to apply. Our team will review your application and get back to you as soon as possible.`;

    await createNotification(
      "New Instructor Application",
      newNotification,
      user?.id ?? "",
    );

    response.status(201).json({
      message:
        "Instructor created successfully. We will get back to you as soon as possible.",
    });

    sendUserEmailNotification({
      emailAddress: user?.emailAddress || "",
      userName: user?.firstName + " " + user?.lastName,
    });

    sendAdminEmailMessages({
      title: "New Instructor Application",
      message: `New  application for instructor position from ${user?.firstName} ${user?.lastName}. Please check the  instructors section of the admin dashboard for more details.`,
      subject: `New  application for instructor position from ${user?.firstName} ${user?.lastName}`,
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
    const { bio, languages, skills } = request.body;

    const userId = (request as CustomRequest).user?.id;

    const user = await findUserById(userId);
    let instructor = await findInstructorByUserId(userId);

    if (!instructor) {
      if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
        instructor = await createNewInstructor(
          userId,
          bio,
          languages,
          skills,
          INSTRUCTOR.APPROVED,
        );
      }
    }

    if (instructor?.status !== INSTRUCTOR.APPROVED) {
      const error = new Error(
        "You are not authorized to perform this action. Please contact the support team for more information.",
      ) as ResponseError;
      error.statusCode = 403;
      return next(error);
    }

    await updateInstructorProfile(userId, bio, languages, skills);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "UPDATE INSTRUCTOR",
      oldData: JSON.stringify(instructor),
      newData: JSON.stringify({
        bio,
        languages,
        skills,
      }),
      section: "INSTRUCTOR",
    });

    const updatedInstructor = await findInstructorByUserId(userId);

    response.status(201).json({
      message: "Instructor profile updated successfully.",
      data: {
        instructor: updatedInstructor,
      },
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
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const instructors = await getAllInstructors(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getAllInstructors(
      keyword as string,
      status as string,
    );

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
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

    const instructor = await getInstructorById(id);

    if (instructor?.userId) {
      const user = await findUserById(instructor.userId);
      instructor.user = user;
    }

    response.status(201).json({
      data: instructor,
    });
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

    const user = (request as CustomRequest).user;

    const adminUser = await findUserById(user?.id);

    if (!adminUser) {
      const error = new Error(
        "Something went wrong. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const targetInstructor = await getInstructorById(id);

    if (!targetInstructor?.userId) {
      const error = new Error(
        "Instructor not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (
      status !== INSTRUCTOR.PENDING &&
      status !== INSTRUCTOR.APPROVED &&
      status !== INSTRUCTOR.SUSPENDED &&
      status !== INSTRUCTOR.DEACTIVATED &&
      status !== INSTRUCTOR.REJECTED
    ) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === targetInstructor.status) {
      const error = new Error(
        "Instructor is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    await updateInstructorStatus(id, status);

    if (status === INSTRUCTOR.APPROVED) {
      await updateUserRole(targetInstructor.userId, ROLES.INSTRUCTOR);
    } else {
      await updateUserRole(targetInstructor.userId, ROLES.USER);
    }

    await createAuditLog({
      user: JSON.stringify(adminUser),
      action: "REVIEW INSTRUCTOR",
      oldData: JSON.stringify(targetInstructor),
      newData: JSON.stringify({
        ...targetInstructor,
        status,
        comment,
      }),
      section: "INSTRUCTOR",
    });

    const newNotification = `Your instructor application has been reviewed and the status has been updated to ${removeUnderscoreFromString(status)}. ${comment}`;

    await createNotification(
      "Your instructor application has been reviewed",
      newNotification,
      targetInstructor?.userId ?? "",
    );

    await createAuditLog({
      user: JSON.stringify(adminUser),
      action: "NEW NOTIFICATION",
      newData: JSON.stringify({
        title: "Your instructor application has been reviewed",
        message: newNotification,
        receiverId: targetInstructor?.userId ?? "",
        senderId: null,
      }),
      section: "NOTIFICATION",
    });

    response.status(201).json({
      message: "Instructor application reviewed successfully.",
    });

    const targetUser = await findUserById(targetInstructor.userId);

    sendUserEmailNotification({
      emailAddress: targetUser?.emailAddress || "",
      userName: targetUser?.firstName + " " + targetUser?.lastName || "",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
