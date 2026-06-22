import { Op } from "sequelize";
import Lesson from "../models/lesson.models";
import {
  LESSON_EXCLUDED_ATTRIBUTES,
  LESSON,
  LESSON_PRICE,
  LESSON_ENROLLMENT,
  LESSON_ATTENDANCE,
  APP_URL,
  REVIEW,
  REVIEW_COMMENT,
  REVIEW_COMMENT_EXCLUDED_ATTRIBUTES,
  DEFAULT_CURRENCY,
} from "../utils/constant";
import { findAllUsers, findUserById } from "./user.services";
import { findAllCategories, findCategoryById } from "./category.services";
import { format } from "date-fns";
import { getWishListByLessonId } from "./wishlist.services";
import LessonEnrollment from "../models/lessonEnrollment.models";
import {
  findAllInstructors,
  findInstructorByUserId,
} from "./instructor.services";
import {
  addSubscriptionCredits,
  findPricingPlanById,
  subtractSubscriptionCredits,
} from "./pricing.services";
import {
  lessonDateStartTime,
  minutesLeftFromNow,
  toSlug,
} from "../utils/formatter";
import User from "../models/user.models";
import { createBulkNotifications } from "./notification.services";
import LessonAttendance from "../models/lessonAttendance.models";
import { generateJwtTokenForLessonRoom } from "./auth.services";
import Review from "../models/review.models";
import { findUserReviewByLessonId } from "./review.services";
import ReviewComment from "../models/reviewComment.models";
import WishList from "../models/wishlist.models";

export const findLessonById = async (
  id: string,
  userId: string | null = null,
  excludeAttributes = true,
) => {
  const lesson = await Lesson.findOne({
    where: { id },
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  if (!lesson) return null;
  return getLessonDependencies(lesson, userId);
};

export const findLessonBySlug = async (
  slug: string,
  userId: string | null = null,
  excludeAttributes = true,
) => {
  const lesson = await Lesson.findOne({
    where: { slug },
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  if (!lesson) return null;
  return getLessonDependencies(lesson, userId);
};

export const findLessonByTitle = async (title: string) => {
  return await Lesson.findOne({ where: { title }, raw: true });
};

export const getAdminLessons = async (
  keyword?: string,
  status?: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = { [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }] };
  }

  if (status) {
    where = { ...where, status };
  }

  if (!offsetSize && !newPageSize) {
    return await Lesson.count({ where });
  }

  const lessons = await Lesson.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getLessonsDependencies(lessons, null);
};

export const getUserLessons = async (
  userId: string,
  keyword?: string,
  status?: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = { [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }] };
  }

  if (status) {
    where = { ...where, status };
  }

  if (!offsetSize && !newPageSize) {
    return await Lesson.count({ where: { userId, ...where } });
  }

  const lessons = await Lesson.findAll({
    where: { userId, ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getLessonsDependencies(lessons, userId);
};

export const getActiveLessons = async (
  status?: string,
  keyword?: string,
  userId: string | null = null,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = { [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }] };
  }

  if (status) {
    where = { ...where, isFree: status === LESSON_PRICE.FREE };
  }

  const baseWhere = {
    status: LESSON.ACTIVE,
    lessonDate: { [Op.gte]: format(new Date(), "yyyy-MM-dd 00:00:00") },
    ...where,
  };

  if (!offsetSize && !newPageSize) {
    return await Lesson.count({ where: baseWhere });
  }

  const lessons = await Lesson.findAll({
    where: baseWhere,
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getLessonsDependencies(lessons, userId);
};

export const updateLessonStatus = async (id: string, status: string) => {
  await Lesson.update({ status }, { where: { id } });
};

export const fetchLessonHistory = async (
  userId: string,
  keyword?: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  const history = await LessonEnrollment.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    raw: true,
  });

  if (!history.length) return [];

  if (!offsetSize && !newPageSize) {
    return await LessonEnrollment.count({ where: { userId } });
  }

  let where = {};

  if (keyword) {
    where = { [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }] };
  }

  const lessons = await Lesson.findAll({
    where: {
      [Op.and]: [
        { id: { [Op.in]: history.map((item) => item.lessonId) } },
        { ...where },
      ],
    },
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  const lessonsWithDependencies = await getLessonsDependencies(lessons, userId);

  return history.map((item) => ({
    ...item,
    lesson:
      lessonsWithDependencies.find((l: Lesson) => l.id === item.lessonId) ||
      null,
  }));
};

export const fetchLiveLessons = async (
  userId: string | null = null,
  excludeAttributes = true,
) => {
  const lessons = await Lesson.findAll({
    where: {
      status: LESSON.ACTIVE,
      lessonDate: {
        [Op.gte]: new Date(new Date().setUTCHours(0, 0, 0, 0)),
        [Op.lt]: new Date(new Date().setUTCHours(23, 59, 59, 999)),
      },
    },
    order: [["createdAt", "DESC"]],
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getLessonsDependencies(lessons, userId);
};

export const findAllLessonsByIds = async (ids: string[]) => {
  return await Lesson.findAll({
    where: { id: { [Op.in]: ids } },
    raw: true,
  });
};

export const getActiveHomeLessons = async (
  userId: string | null = null,
  excludeAttributes = true,
) => {
  const lessons = await Lesson.findAll({
    where: {
      status: LESSON.ACTIVE,
      lessonDate: { [Op.gte]: format(new Date(), "yyyy-MM-dd 00:00:00") },
    },
    order: [["createdAt", "DESC"]],
    limit: 8,
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getLessonsDependencies(lessons, userId);
};

export const fetchLessonsByCategory = async (
  categoryId: string,
  userId: string | null = null,
  keyword?: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = { [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }] };
  }

  const baseWhere = { categoryId, status: LESSON.ACTIVE, ...where };

  if (!offsetSize && !newPageSize) {
    return await Lesson.count({ where: baseWhere });
  }

  const lessons = await Lesson.findAll({
    where: baseWhere,
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getLessonsDependencies(lessons, userId);
};

export const fetchLessonsByInstructor = async (
  userId: string | null,
  instructorId: string,
  keyword?: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = { [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }] };
  }

  const baseWhere = { userId: instructorId, ...where };

  if (!offsetSize && !newPageSize) {
    return await Lesson.count({ where: baseWhere });
  }

  const lessons = await Lesson.findAll({
    where: baseWhere,
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  return getLessonsDependencies(lessons, userId);
};

export const fetchAllInstructorLessons = async (
  userId: string,
  excludeAttributes = true,
) => {
  return await Lesson.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });
};

export const addLessonInformation = async (
  userId: string,
  title: string,
  category: string,
  level: string,
  language: string,
  duration: string,
  lateJoinMinutes: string,
  lessonDate: string,
  startTime: string,
  endTime: string,
  participants: number,
  description: string,
  freeLesson: string,
  lectures: { title: string; description: string }[],
  seoTitle: string,
  seoDescription: string,
  seoTags: string,
  file: string | null,
) => {
  const slug = toSlug(title);

  return await Lesson.create({
    id: crypto.randomUUID(),
    slug,
    userId,
    title,
    categoryId: category,
    level,
    language,
    isLive: false,
    durationMinutes: Number(duration),
    lateJoinMinutes,
    lessonDate,
    startTime,
    endTime,
    maxStudents: participants,
    description,
    isFree: freeLesson === "true",
    creditsRequired: 1,
    image: file,
    lectures: JSON.stringify(lectures),
    seoTitle,
    seoDescription,
    seoTags,
    status: LESSON.ACTIVE,
  });
};

export const updateLessonInformation = async (
  id: string,
  title: string,
  category: string,
  level: string,
  language: string,
  duration: string,
  lateJoinMinutes: string,
  lessonDate: string,
  startTime: string,
  endTime: string,
  participants: number,
  description: string,
  freeLesson: string,
  lectures: { title: string; description: string }[],
  seoTitle: string,
  seoDescription: string,
  seoTags: string,
  file: string | null,
) => {
  return await Lesson.update(
    {
      title,
      categoryId: category,
      level,
      language,
      isLive: false,
      durationMinutes: Number(duration),
      lateJoinMinutes,
      lessonDate,
      startTime,
      endTime,
      maxStudents: participants,
      description,
      isFree: freeLesson === "true",
      creditsRequired: 1,
      image: file,
      lectures: JSON.stringify(lectures),
      seoTitle,
      seoDescription,
      seoTags,
      status: LESSON.ACTIVE,
    },
    { where: { id } },
  );
};

export const fetchAllLessons = async (userId: string) => {
  const lessons = await Lesson.findAll({
    where: { lessonDate: { [Op.gte]: format(new Date(), "yyyy-MM-dd") } },
    raw: true,
  });

  return getLessonsDependencies(lessons, userId);
};

export const verifyFreeLessonsByInstructorId = async (userId: string) => {
  const lessons = await Lesson.findAll({
    where: { userId, isFree: true, status: LESSON.ACTIVE },
    attributes: ["id", "lessonDate"],
    raw: true,
  });

  return lessons.some(
    (l) =>
      l.lessonDate &&
      new Date(l.lessonDate).getMonth() === new Date().getMonth(),
  );
};

export const verifyLessonEnrollment = async (
  userId: string,
  lessonId: string,
) => {
  return await LessonEnrollment.findOne({
    where: { userId, lessonId, status: LESSON_ENROLLMENT.ACTIVE },
  });
};

export const checkSeatAvailability = async (lessonId: string) => {
  const lesson = await findLessonById(lessonId);
  if (!lesson?.maxStudents) return false;

  const enrolled = await LessonEnrollment.count({
    where: { lessonId, status: LESSON_ENROLLMENT.ACTIVE },
  });

  return lesson.maxStudents - enrolled > 0;
};

export const enrolLesson = async (
  userId: string,
  lessonId: string,
  subscriptionId: string,
) => {
  await LessonEnrollment.create({
    id: crypto.randomUUID(),
    userId,
    lessonId,
    status: LESSON_ENROLLMENT.ACTIVE,
    creditsUsed: 1,
  });

  await subtractSubscriptionCredits(userId, subscriptionId, 1);
  return true;
};

export const cancelLesson = async (
  userId: string,
  lessonId: string,
  subscriptionId: string,
) => {
  await LessonEnrollment.update(
    { status: LESSON_ENROLLMENT.CANCELLED, creditsUsed: 0 },
    { where: { userId, lessonId } },
  );

  await addSubscriptionCredits(userId, subscriptionId, 1);
  return true;
};

export const getLessonsDependencies = async (
  lessons: Lesson[],
  userId: string | null = null,
) => {
  if (!lessons.length) return [];

  const lessonIds = lessons.map((l) => l.id);

  const [users, reviews, instructors, categories, wishlists, enrollments] =
    await Promise.all([
      findAllUsers(),
      Review.findAll({
        where: { lessonId: { [Op.in]: lessonIds }, status: REVIEW.ACTIVE },
        raw: true,
      }),
      findAllInstructors(),
      findAllCategories(),
      userId
        ? WishList.findAll({ where: { userId }, raw: true })
        : Promise.resolve([]),
      LessonEnrollment.findAll({
        where: {
          lessonId: { [Op.in]: lessonIds },
          status: LESSON_ENROLLMENT.ACTIVE,
        },
        raw: true,
      }),
    ]);

  lessons.forEach((lesson) => {
    lesson.user = users.find((u) => u.id === lesson.userId) || null;
    lesson.instructor =
      instructors.find((i) => i.userId === lesson.userId) || null;
    lesson.category =
      categories.find((c) => c.id === lesson.categoryId) || null;

    const lessonReviews = reviews.filter((r) => r.lessonId === lesson.id);
    lesson.reviewCount = lessonReviews.length;
    lesson.rating = calcRating(lessonReviews);

    const lessonEnrollments = enrollments.filter(
      (e) => e.lessonId === lesson.id,
    );
    lesson.enrollees = lessonEnrollments.length;
    lesson.seatsLeft = lesson.maxStudents
      ? lesson.maxStudents - lessonEnrollments.length
      : 0;

    if (userId) {
      lesson.wishlist = wishlists.some(
        (w) => w.lessonId === lesson.id && w.userId === userId,
      );
      lesson.enrolled = lessonEnrollments.some((e) => e.userId === userId);
    }
  });

  return lessons;
};

export const getLessonDependencies = async (
  lesson: Lesson,
  userId: string | null = null,
) => {
  const [users, category, instructor, enrolledLesson, reviews] =
    await Promise.all([
      findAllUsers(),
      findCategoryById(lesson.categoryId || ""),
      findInstructorByUserId(lesson.userId || ""),
      LessonEnrollment.findAll({
        where: { lessonId: lesson.id, status: LESSON_ENROLLMENT.ACTIVE },
        raw: true,
      }),
      Review.findAll({
        where: { lessonId: lesson.id, status: REVIEW.ACTIVE },
        raw: true,
      }),
    ]);

  const reviewComments = await ReviewComment.findAll({
    where: {
      reviewId: { [Op.in]: reviews.map((r) => r.id) },
      status: REVIEW_COMMENT.ACTIVE,
    },
    attributes: { exclude: REVIEW_COMMENT_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  reviews.forEach((review) => {
    review.user = users.find((u) => u.id === review.userId) || null;
    review.reply = reviewComments.find((c) => c.reviewId === review.id) || null;
  });

  const attendance = await LessonAttendance.findAll({
    where: { lessonId: lesson.id, status: LESSON_ATTENDANCE.ATTENDED },
    raw: true,
  });

  const attendanceUsers = users.filter((u) =>
    attendance.some((a) => a.userId === u.id),
  );

  lesson.user = users.find((u) => u.id === lesson.userId) || null;
  lesson.category = category;
  lesson.instructor = instructor;
  lesson.seatsLeft = lesson.maxStudents
    ? lesson.maxStudents - enrolledLesson.length
    : 0;
  lesson.lessonAttendance = attendanceUsers;
  lesson.lessonReviews = reviews;
  lesson.reviewCount = reviews.length;
  lesson.rating = calcRating(reviews);
  lesson.canReview = !!attendanceUsers.find((u) => u.id === userId);
  lesson.wishlist = false;
  lesson.enrolled = false;

  if (userId) {
    const [wishlist, enrolled, userReview] = await Promise.all([
      getWishListByLessonId(userId, lesson.id || ""),
      verifyLessonEnrollment(userId, lesson.id || ""),
      findUserReviewByLessonId(userId, lesson.id || ""),
    ]);

    lesson.wishlist = !!wishlist;
    lesson.enrolled = !!enrolled;
    lesson.isReviewedByUser = lesson.canReview && !!userReview;
  }

  return lesson;
};

export const sendUserLessonNotification = async () => {
  const lessons = await Lesson.findAll({
    where: {
      lessonDate: { [Op.eq]: format(new Date(), "yyyy-MM-dd") },
      status: LESSON.ACTIVE,
    },
    raw: true,
  });

  if (!lessons.length) return;

  const lessonEnrollees = await LessonEnrollment.findAll({
    where: {
      lessonId: { [Op.in]: lessons.map((l) => l.id) },
      status: LESSON_ENROLLMENT.ACTIVE,
    },
    raw: true,
  });

  const users = await User.findAll({
    where: {
      id: { [Op.in]: lessonEnrollees.map((e) => e.userId) },
    },
    raw: true,
  });

  const NOTIFICATION_THRESHOLDS = [1440, 60, 30, 15, 5, 1];

  for (const lesson of lessons) {
    if (!lesson.startTime || !lesson.lessonDate) continue;

    const lessonDateTime = lessonDateStartTime(
      lesson.startTime,
      lesson.lessonDate,
    );
    const checkTimeElapsed = minutesLeftFromNow(lessonDateTime);

    if (
      checkTimeElapsed === null ||
      !NOTIFICATION_THRESHOLDS.includes(checkTimeElapsed)
    ) {
      continue;
    }

    const enrolledUserIds = new Set(
      lessonEnrollees
        .filter((e) => e.lessonId === lesson.id)
        .map((e) => e.userId),
    );

    sendLessonNotification(
      users.filter((u) => enrolledUserIds.has(u.id)),
      lesson,
      checkTimeElapsed,
    );
  }
};

export const sendLessonNotification = (
  users: User[],
  lesson: Lesson,
  minutesLeft: number,
) => {
  createBulkNotifications(
    users.map((u) => ({
      title: "Upcoming Lesson Alert Notification",
      message: `${lesson.title} will begin in less than ${minutesLeft} ${minutesLeft === 1 ? "minute" : "minutes"}`,
      receiverId: u.id || "",
      senderId: null,
    })),
  );
};

export const findLessonAttendance = (userId: string, lessonId: string) => {
  return LessonAttendance.findOne({ where: { userId, lessonId }, raw: true });
};

export const joinLessonRoom = async (
  userId: string,
  lessonId: string,
  isHost: boolean,
  planId: string | null,
) => {
  const joinLink = generateJoinCallLink(lessonId, userId);

  let instructorPayout: number | null = null;
  let platformAmount: number | null = null;

  if (planId) {
    const plan = await findPricingPlanById(planId);
    if (
      plan?.amountPerSession &&
      plan?.instructorPercentageFee &&
      plan?.platformPercentageFee
    ) {
      instructorPayout =
        plan.amountPerSession * (plan.instructorPercentageFee / 100);
      platformAmount =
        plan.amountPerSession * (plan.platformPercentageFee / 100);
    }
  }

  const checkAttendance = await findLessonAttendance(userId, lessonId);

  if (checkAttendance) {
    await LessonAttendance.update(
      { joinTime: new Date(), joinLink, status: LESSON_ATTENDANCE.ATTENDED },
      { where: { userId, lessonId } },
    );
  } else {
    await LessonAttendance.create({
      id: crypto.randomUUID(),
      userId,
      lessonId,
      joinTime: new Date(),
      currency: isHost ? null : DEFAULT_CURRENCY,
      payoutAmount: isHost ? null : instructorPayout,
      platformAmount: isHost ? null : platformAmount,
      joinLink,
      isHost,
      status: LESSON_ATTENDANCE.ATTENDED,
    });
  }

  await Lesson.update({ isLive: true }, { where: { id: lessonId } });
  return joinLink;
};

export const leaveLessonRoom = async (
  userId: string,
  lessonId: string,
  attendance: LessonAttendance,
) => {
  const durationMinutes = attendance?.joinTime
    ? minutesLeftFromNow(new Date(attendance.joinTime))
    : null;

  await LessonAttendance.update(
    {
      leaveTime: new Date(),
      durationMinutes,
      eligibleForPayout: durationMinutes ? durationMinutes >= 10 : null,
      status: LESSON_ATTENDANCE.LEFT,
    },
    { where: { userId, lessonId } },
  );

  const remaining = await LessonAttendance.count({
    where: { lessonId, status: LESSON_ATTENDANCE.ATTENDED },
  });

  if (remaining === 0) {
    await Lesson.update({ isLive: false }, { where: { id: lessonId } });
  }

  return true;
};

export const generateJoinCallLink = (lessonId: string, userId: string) => {
  return `${APP_URL}/lessons/room/${lessonId}?userId=${userId}&jwtToken=${generateJwtTokenForLessonRoom(userId, lessonId)}`;
};

export const calcRating = (reviews: Review[]) =>
  reviews.length
    ? reviews.reduce((acc, r) => acc + Number(r.rating), 0) / reviews.length
    : 0;
