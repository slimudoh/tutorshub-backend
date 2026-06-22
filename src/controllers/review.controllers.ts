import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError, makeError } from "../services/error.services";
import {
  createUserReview,
  fetchAdminReviews,
  fetchHomeReviews,
  fetchUserReviews,
  findUserReviewByLessonId,
  fetchReviewsByInstructor,
  getReviewById,
  createReviewComment,
  findExistingReply,
} from "../services/review.services";
import { findLessonById } from "../services/lesson.services";
import { findInstructorByUserId } from "../services/instructor.services";
import { createNotification } from "../services/notification.services";
import {
  createAuditLog,
  createBulkAuditLogs,
} from "../services/auditLog.services";
import { REVIEW_COMMENT } from "../utils/constant";
import { paginationHelper } from "../utils/formatter";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getAdminReviews: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [reviews, totalRecords] = await Promise.all([
      fetchAdminReviews(offsetSize, newPageSize),
      fetchAdminReviews() as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: reviews,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getUserReviews: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [reviews, totalRecords] = await Promise.all([
      fetchUserReviews(userId, offsetSize, newPageSize),
      fetchUserReviews(userId) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: reviews,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getHomeReviews: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const reviews = await fetchHomeReviews();
    response.status(200).json({
      data: reviews,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const createReview: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id, rating, title, experience, recommend } = request.body;
    const userId = (request as CustomRequest).user?.id;

    const lesson = await findLessonById(id);
    if (!lesson?.id) {
      return next(makeError("Lesson not found.", 404));
    }

    const userReview = await findUserReviewByLessonId(userId, lesson.id);
    if (userReview?.id) {
      return next(makeError("You have already reviewed this lesson.", 400));
    }

    await createUserReview(
      userId,
      lesson.id,
      rating,
      title,
      experience,
      recommend,
    );

    response.status(201).json({ message: "Review added successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getReviewsByInstructor: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const { pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const instructor = await findInstructorByUserId(id);

    if (!instructor?.userId) {
      return next(makeError("Instructor not found.", 404));
    }

    const [reviews, totalRecords] = await Promise.all([
      fetchReviewsByInstructor(instructor.userId, offsetSize, newPageSize),
      fetchReviewsByInstructor(instructor.userId) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: reviews,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const replyUserReview: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { reviewId, comment } = request.body;

    const replier = (request as CustomRequest).user;

    const targetReview = await getReviewById(reviewId);
    if (!targetReview?.id) {
      return next(makeError("Review not found. Please try again later.", 404));
    }

    const reply = await findExistingReply(reviewId);
    if (reply?.status === REVIEW_COMMENT.ACTIVE) {
      return next(makeError("Review has already been commented on.", 400));
    }

    await createReviewComment(reviewId, comment);

    const replierName = `${replier.firstName} ${replier.lastName}`;
    const notificationMessage = `Your review has been commented on by ${replierName}. ${comment}`;

    const reviewAuthorId = targetReview.userId;

    await Promise.all([
      createNotification(
        "Your review has been commented on",
        notificationMessage,
        reviewAuthorId || "",
      ),
      createAuditLog({
        user: JSON.stringify(replier),
        action: "COMMENT ON REVIEW",
        oldData: JSON.stringify(targetReview),
        newData: JSON.stringify({ ...targetReview, comment }),
        section: "REVIEW",
      }),
    ]);

    response.status(200).json({ message: "Review commented successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
