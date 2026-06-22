import { Op } from "sequelize";
import {
  REVIEW,
  REVIEW_COMMENT,
  REVIEW_COMMENT_EXCLUDED_ATTRIBUTES,
  REVIEW_EXCLUDED_ATTRIBUTES,
  USER_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import Review from "../models/review.models";
import Lesson from "../models/lesson.models";
import { findAllUsers } from "./user.services";
import ReviewComment from "../models/reviewComment.models";
import User from "../models/user.models";

export const getReviewById = async (id: string, excludeAttributes = true) => {
  return await Review.findOne({
    where: { id },
    ...(excludeAttributes && {
      attributes: { exclude: REVIEW_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });
};

export const fetchAdminReviews = async (
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  const lessons = await Lesson.findAll({ attributes: ["id"], raw: true });
  const lessonIds = lessons.map((l) => l.id);

  if (!offsetSize && !newPageSize) {
    return await Review.count({
      where: { lessonId: { [Op.in]: lessonIds } },
    });
  }

  const reviews = await Review.findAll({
    where: { lessonId: { [Op.in]: lessonIds } },
    order: [["createdAt", "DESC"]] as any,
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: REVIEW_EXCLUDED_ATTRIBUTES },
    }),
    raw: true as const,
  });

  return attachReviewRelations(reviews);
};

export const fetchUserReviews = async (
  userId: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  const lessons = await Lesson.findAll({
    where: { userId },
    attributes: ["id"],
    raw: true,
  });
  const lessonIds = lessons.map((l) => l.id);

  if (!offsetSize && !newPageSize) {
    return await Review.count({
      where: { lessonId: { [Op.in]: lessonIds } },
    });
  }

  const reviews = await Review.findAll({
    where: { lessonId: { [Op.in]: lessonIds } },
    order: [["createdAt", "DESC"]] as any,
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: REVIEW_EXCLUDED_ATTRIBUTES },
    }),
    raw: true as const,
  });

  return attachReviewRelations(reviews);
};

export const fetchHomeReviews = async (excludeAttributes = true) => {
  const reviews = await Review.findAll({
    where: { isPublic: true, status: REVIEW.ACTIVE },
    order: [["createdAt", "DESC"]],
    limit: 10,
    ...(excludeAttributes && {
      attributes: { exclude: REVIEW_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return attachReviewRelations(reviews);
};

export const findUserReviewByLessonId = async (
  userId: string,
  lessonId: string,
  excludeAttributes = true,
) => {
  return await Review.findOne({
    where: { userId, lessonId },
    ...(excludeAttributes && {
      attributes: { exclude: REVIEW_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });
};

export const createUserReview = async (
  userId: string,
  lessonId: string,
  rating: number,
  title: string,
  comment: string,
  recommendInstructor: boolean,
) => {
  return await Review.create({
    id: crypto.randomUUID(),
    userId,
    lessonId,
    rating,
    title,
    comment,
    recommendInstructor,
    status: REVIEW.ACTIVE,
  });
};

export const fetchReviewsByInstructor = async (
  instructorId: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  const lessons = await Lesson.findAll({
    where: { userId: instructorId },
    attributes: ["id"],
    raw: true,
  });
  const lessonIds = lessons.map((l) => l.id);

  if (!offsetSize && !newPageSize) {
    return await Review.count({
      where: { lessonId: { [Op.in]: lessonIds } },
    });
  }

  const reviews = await Review.findAll({
    where: {
      lessonId: { [Op.in]: lessonIds },
    },
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: REVIEW_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });

  return attachReviewRelations(reviews);
};

export const createReviewComment = async (
  reviewId: string,
  comment: string,
) => {
  return await ReviewComment.create({
    id: crypto.randomUUID(),
    reviewId,
    comment,
    status: REVIEW_COMMENT.ACTIVE,
  });
};

export const findExistingReply = async (reviewId: string) => {
  return await ReviewComment.findOne({
    where: { reviewId },
    raw: true,
  });
};

const attachReviewRelations = async (reviews: Review[]) => {
  if (!reviews.length) return reviews;

  const userIds = [...new Set(reviews.map((r) => r.userId))];
  const lessonIds = [...new Set(reviews.map((r) => r.lessonId))];
  const reviewIds = reviews.map((r) => r.id);

  const [users, lessons, reviewComments] = await Promise.all([
    User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: { exclude: USER_EXCLUDED_ATTRIBUTES },
      raw: true,
    }),
    Lesson.findAll({
      where: { id: { [Op.in]: lessonIds } },
      attributes: ["id", "title", "slug", "userId"],
      raw: true,
    }),
    ReviewComment.findAll({
      where: {
        reviewId: { [Op.in]: reviewIds },
        status: REVIEW_COMMENT.ACTIVE,
      },
      attributes: { exclude: REVIEW_COMMENT_EXCLUDED_ATTRIBUTES },
      raw: true,
    }),
  ]);

  reviews.forEach((review) => {
    review.user = users.find((u) => u.id === review.userId) || null;
    review.lesson = lessons.find((l) => l.id === review.lessonId) || null;
    review.reply = reviewComments.find((c) => c.reviewId === review.id) || null;
  });

  return reviews;
};
