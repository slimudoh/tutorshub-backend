import { Op } from "@sequelize/core";
import Instructor from "../models/instructor.models";
import {
  INSTRUCTOR,
  INSTRUCTOR_EXCLUDED_ATTRIBUTES,
  LESSON_EXCLUDED_ATTRIBUTES,
  REVIEW,
  REVIEW_COMMENT,
  REVIEW_COMMENT_EXCLUDED_ATTRIBUTES,
  REVIEW_EXCLUDED_ATTRIBUTES,
  USER_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import User from "../models/user.models";
import LessonAttendance from "../models/lessonAttendance.models";
import Lesson from "../models/lesson.models";
import Review from "../models/review.models";
import ReviewComment from "../models/reviewComment.models";

export const createNewInstructor = async (
  userId: string,
  firstName: string,
  lastName: string,
  bio: string,
  profession: string,
  experience: string,
  languages: string[],
  skills: string[],
  socialLinks: string[],
  status: string,
) => {
  return await Instructor.create({
    id: crypto.randomUUID(),
    userId,
    firstName,
    lastName,
    bio,
    profession,
    experience,
    languages: JSON.stringify(languages),
    skills: JSON.stringify(skills),
    socialLinks: JSON.stringify(socialLinks),
    status,
  });
};

export const updateInstructorProfile = async (
  userId: string,
  firstName: string,
  lastName: string,
  bio: string,
  profession: string,
  experience: string,
  languages: string[],
  skills: string[],
  socialLinks: string[],
) => {
  return await Instructor.update(
    {
      firstName,
      lastName,
      bio,
      profession,
      experience,
      languages: JSON.stringify(languages),
      skills: JSON.stringify(skills),
      socialLinks: JSON.stringify(socialLinks),
    },
    { where: { userId } },
  );
};

export const updateInstructorNames = async (
  userId: string,
  firstName: string,
  lastName: string,
) => {
  return await Instructor.update(
    { firstName, lastName },
    { where: { userId } },
  );
};

export const findInstructorByUserId = async (userId: string) => {
  return await Instructor.findOne({ where: { userId }, raw: true });
};

export const getInstructorById = async (
  id: string,
  excludeAttributes = true,
) => {
  let instructor = await Instructor.findOne({
    where: { id },
    ...(excludeAttributes && {
      attributes: { exclude: INSTRUCTOR_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  if (instructor) {
    instructor = await getInstructorDependencies(instructor, id);
  }

  return instructor;
};

export const getAllInstructors = async (
  keyword: string,
  status: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { skills: { [Op.like]: `%${keyword}%` } },
        { languages: { [Op.like]: `%${keyword}%` } },
        { bio: { [Op.like]: `%${keyword}%` } },
        { profession: { [Op.like]: `%${keyword}%` } },
        { socialLinks: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (status) {
    where = { ...where, status };
  }

  if (!offsetSize && !newPageSize) {
    return await Instructor.count({ where });
  }

  const instructors = await Instructor.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: INSTRUCTOR_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getInstructorsDependencies(instructors);
};

export const getInstructorByUserId = async (
  userId: string,
  excludeAttributes = true,
) => {
  let instructor = await Instructor.findOne({
    where: { userId },
    ...(excludeAttributes && {
      attributes: { exclude: INSTRUCTOR_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  if (instructor) {
    instructor = await getInstructorDependencies(instructor, userId);
  }

  return instructor;
};

export const updateInstructorStatus = async (id: string, status: string) => {
  await Instructor.update({ status }, { where: { id } });
};

export const fetchActiveInstructors = async (
  keyword: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { firstName: { [Op.like]: `%${keyword}%` } },
        { lastName: { [Op.like]: `%${keyword}%` } },
        { skills: { [Op.like]: `%${keyword}%` } },
        { languages: { [Op.like]: `%${keyword}%` } },
        { bio: { [Op.like]: `%${keyword}%` } },
        { profession: { [Op.like]: `%${keyword}%` } },
        { socialLinks: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (!offsetSize && !newPageSize) {
    return await Instructor.count({ where });
  }

  const instructors = await Instructor.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: INSTRUCTOR_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getInstructorsDependencies(instructors);
};

export const fetchHomeInstructors = async () => {
  const reviews = await Review.findAll({
    where: { recommendInstructor: true },
    raw: true,
    attributes: ["lessonId"],
  });

  const lessonIds = [...new Set(reviews.map((r) => r.lessonId))];

  const lessons = await Lesson.findAll({
    where: { id: { [Op.in]: lessonIds } },
    attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  const userIds = [...new Set(lessons.map((l) => l.userId))];

  const instructors = await Instructor.findAll({
    where: { userId: { [Op.in]: userIds } },
    attributes: { exclude: INSTRUCTOR_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  return getInstructorsDependencies(instructors);
};

export const findAllInstructors = async () => {
  return await Instructor.findAll({
    raw: true,
    attributes: { exclude: INSTRUCTOR_EXCLUDED_ATTRIBUTES },
  });
};

export const getInstructorsDependencies = async (instructors: Instructor[]) => {
  if (!instructors.length) return [];

  const instructorUserIds = instructors.map((i) => i.userId);

  // fetch users and all instructor lessons in parallel
  const [users, allLessons] = await Promise.all([
    User.findAll({
      where: { id: { [Op.in]: instructorUserIds } },
      attributes: { exclude: USER_EXCLUDED_ATTRIBUTES },
      raw: true,
    }),
    Lesson.findAll({
      where: { userId: { [Op.in]: instructorUserIds } },
      order: [["createdAt", "DESC"]],
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
      raw: true,
    }),
  ]);

  const lessonIds = allLessons.map((l) => l.id);

  const reviews = await Review.findAll({
    where: { lessonId: { [Op.in]: lessonIds }, status: REVIEW.ACTIVE },
    attributes: { exclude: REVIEW_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  instructors.forEach((instructor) => {
    instructor.user = users.find((u) => u.id === instructor.userId) || null;

    // cap per-instructor lessons at 6
    instructor.lessons = allLessons
      .filter((l) => l.userId === instructor.userId)
      .slice(0, 6);

    attachLessonReviewStats(instructor.lessons, reviews);

    const instructorReviews = reviews.filter((r) =>
      instructor.lessons?.some((l) => l.id === r.lessonId),
    );

    instructor.lessonReviews = instructorReviews;
    instructor.reviewCount = instructorReviews.length;
    instructor.rating = calcRating(instructorReviews);
  });

  return instructors;
};

export const getInstructorDependencies = async (
  instructor: Instructor,
  userId: string,
) => {
  const [user, totalStudents, totalLessons, lessons] = await Promise.all([
    User.findOne({
      where: { id: instructor.userId },
      attributes: { exclude: USER_EXCLUDED_ATTRIBUTES },
      raw: true,
    }),
    LessonAttendance.count({ where: { userId } }),
    Lesson.count({ where: { userId } }),
    Lesson.findAll({
      where: { userId },
      limit: 6,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
      raw: true,
    }),
  ]);

  const lessonIds = lessons.map((l) => l.id);

  const reviews = await Review.findAll({
    where: {
      lessonId: { [Op.in]: lessonIds },
      status: REVIEW.ACTIVE,
    },
    limit: 10,
    attributes: { exclude: REVIEW_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  const reviewComments = await ReviewComment.findAll({
    where: {
      reviewId: { [Op.in]: reviews.map((r) => r.id) },
      status: REVIEW_COMMENT.ACTIVE,
    },
    attributes: { exclude: REVIEW_COMMENT_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  // attach user and reply to each review
  reviews.forEach((review) => {
    review.user = review.userId === user?.id ? user : null;
    review.reply = reviewComments.find((c) => c.reviewId === review.id) || null;
  });

  attachLessonReviewStats(lessons, reviews);

  instructor.user = user;
  instructor.totalStudents = totalStudents;
  instructor.totalLessons = totalLessons;
  instructor.lessons = lessons;
  instructor.lessonReviews = reviews;
  instructor.reviewCount = reviews.length;
  instructor.rating = calcRating(reviews);

  return instructor;
};

export const calcRating = (reviews: Review[]) =>
  reviews.length
    ? reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0) / reviews.length
    : 0;

export const attachLessonReviewStats = (
  lessons: Lesson[],
  reviews: Review[],
) => {
  lessons.forEach((lesson) => {
    const lessonReviews = reviews.filter((r) => r.lessonId === lesson.id);
    lesson.reviewCount = lessonReviews.length;
    lesson.rating = calcRating(lessonReviews);
  });
};
