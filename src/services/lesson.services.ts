import { Op } from "sequelize";
import Lesson from "../models/lesson.models";
import {
  LESSON_EXCLUDED_ATTRIBUTES,
  LESSON,
  LESSON_PRICE,
  LESSON_ENROLLMENT,
  LESSON_ATTENDANCE,
  REVIEW,
  REVIEW_COMMENT,
  REVIEW_COMMENT_EXCLUDED_ATTRIBUTES,
  DEFAULT_CURRENCY,
  SUBSCRIPTION,
  TRANSACTION_TYPE,
  TRANSACTION_STATUS,
  ELIGIBLE_FOR_PAYOUT_MINUTE,
} from "../utils/constant";
import { findAllUsers } from "./user.services";
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
  subtractSubscriptionCredits,
} from "./pricing.services";
import {
  elapsedMinutes,
  lessonDateStartTime,
  minutesLeftFromNow,
} from "../utils/formatter";
import User from "../models/user.models";
import { createBulkNotifications } from "./notification.services";
import LessonAttendance from "../models/lessonAttendance.models";
import Review from "../models/review.models";
import { findUserReviewByLessonId } from "./review.services";
import ReviewComment from "../models/reviewComment.models";
import WishList from "../models/wishlist.models";
import { fetchLessonEnrollees } from "./enrollee.services";
import SubscriptionPlan from "../models/subscriptionPlan.models";
import { createTransaction } from "./transaction.services";
import Transaction from "../models/transaction.models";
import { createRoom, leaveLessonRoom, updateRoom } from "./room.services";
import sequelize from "../utils/db";

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

export const findLessonByDateTime = async (
  lessonDate: string,
  startTime: string,
  excludeId?: string,
  viewerUserId?: string,
  includeFullAttributes = false,
) => {
  const lesson = await Lesson.findOne({
    where: {
      lessonDate,
      startTime,
      ...(excludeId && { id: { [Op.ne]: excludeId } }),
    },
    ...(!includeFullAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  if (!lesson) return null;

  if (viewerUserId !== undefined) {
    return getLessonDependencies(lesson, viewerUserId);
  }

  return lesson;
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
    order: [["updatedAt", "DESC"]],
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
    order: [["updatedAt", "DESC"]],
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
    order: [["updatedAt", "DESC"]],
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
    order: [["updatedAt", "DESC"]],
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
    order: [["updatedAt", "DESC"]],
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
    order: [["updatedAt", "DESC"]],
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
    order: [["updatedAt", "DESC"]],
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
    order: [["updatedAt", "DESC"]],
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
    order: [["updatedAt", "DESC"]],
    ...(excludeAttributes && {
      attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });
};

export const addLessonInformation = async (payload: {
  userId: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  language: string;
  duration: string;
  lateJoinMinutes: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  participants: number;
  description: string;
  freeLesson: string;
  lectures: { title: string; description: string }[];
  seoTitle: string;
  seoDescription: string;
  seoTags: string;
  file: string | null;
}) => {
  const lessonId = crypto.randomUUID();

  const data = await createRoom(lessonId, payload.participants);

  return await Lesson.create({
    id: lessonId,
    externalRoomId: data.id,
    externalFriendlyUrl: data.friendly_url,
    userId: payload.userId,
    slug: payload.slug,
    title: payload.title,
    categoryId: payload.category,
    level: payload.level,
    language: payload.language,
    isLive: false,
    durationMinutes: Number(payload.duration),
    lateJoinMinutes: payload.lateJoinMinutes,
    lessonDate: payload.lessonDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    maxStudents: payload.participants,
    description: payload.description,
    isFree: payload.freeLesson === "true",
    creditsRequired: 1,
    image: payload.file,
    lectures: JSON.stringify(payload.lectures),
    seoTitle: payload.seoTitle,
    seoDescription: payload.seoDescription,
    seoTags: payload.seoTags,
    roomId: crypto.randomUUID(),
    status: LESSON.ACTIVE,
  });
};

export const updateLessonInformation = async (payload: {
  id: string;
  title: string;
  category: string;
  level: string;
  language: string;
  duration: string;
  lateJoinMinutes: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  participants: number;
  description: string;
  freeLesson: string;
  lectures: { title: string; description: string }[];
  seoTitle: string;
  seoDescription: string;
  seoTags: string;
  file: string | null;
  externalRoomId: string;
  slug: string;
}) => {
  let data = null;
  if (payload.externalRoomId && payload.slug) {
    data = await updateRoom(payload.externalRoomId, payload.participants);
  } else {
    data = await createRoom(payload.id, payload.participants);
  }

  return await Lesson.update(
    {
      externalRoomId: data.id,
      externalFriendlyUrl: data.friendly_url,
      title: payload.title,
      categoryId: payload.category,
      level: payload.level,
      language: payload.language,
      isLive: false,
      durationMinutes: Number(payload.duration),
      lateJoinMinutes: payload.lateJoinMinutes,
      lessonDate: payload.lessonDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxStudents: payload.participants,
      description: payload.description,
      isFree: payload.freeLesson === "true",
      creditsRequired: 1,
      image: payload.file,
      lectures: JSON.stringify(payload.lectures),
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
      seoTags: payload.seoTags,
      status: LESSON.ACTIVE,
    },
    { where: { id: payload.id } },
  );
};

export const fetchAllLessons = async (userId: string) => {
  const lessons = await Lesson.findAll({
    where: { lessonDate: { [Op.gte]: format(new Date(), "yyyy-MM-dd") } },
    raw: true,
  });

  return getLessonsDependencies(lessons, userId);
};

export const verifyFreeLessonsByInstructorId = async (
  userId: string,
  excludeLessonId?: string,
) => {
  const where: any = {
    userId,
    isFree: true,
  };

  if (excludeLessonId) {
    where.id = { [Op.ne]: excludeLessonId };
  }

  const lessons = await Lesson.findAll({
    where,
    attributes: ["id", "lessonDate"],
    raw: true,
  });

  return lessons.some(
    (l: Lesson) =>
      l.lessonDate &&
      new Date(l.lessonDate).getMonth() === new Date().getMonth() &&
      new Date(l.lessonDate).getFullYear() === new Date().getFullYear(),
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

  // Active participants — currently in the room
  const activeAttendance = await LessonAttendance.findAll({
    where: { lessonId: lesson.id, status: LESSON_ATTENDANCE.ATTENDED },
    raw: true,
  });

  // All attendance — includes LEFT, used for canReview
  const allAttendance = await LessonAttendance.findAll({
    where: {
      lessonId: lesson.id,
      status: { [Op.in]: [LESSON_ATTENDANCE.ATTENDED, LESSON_ATTENDANCE.LEFT] },
    },
    raw: true,
  });

  const attendanceUsers = users.filter((u) =>
    activeAttendance.some((a) => a.userId === u.id),
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
  // lesson.canReview = allAttendance.some((a) => a.userId === userId);
  lesson.canReview = allAttendance.some(
    (a) => a.userId === userId && a.status === LESSON_ATTENDANCE.COMPLETED,
  );
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

    const roundedTime = Math.round(checkTimeElapsed ?? -1);

    if (!NOTIFICATION_THRESHOLDS.includes(roundedTime)) {
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
      roundedTime,
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

export const calcRating = (reviews: Review[]) =>
  reviews.length
    ? reviews.reduce((acc, r) => acc + Number(r.rating), 0) / reviews.length
    : 0;

export const cleanupStaleAttendance = async () => {
  const staleAttendances = await LessonAttendance.findAll({
    where: { status: LESSON_ATTENDANCE.ATTENDED },
    include: [
      {
        model: Lesson,
        as: "lesson",
        attributes: ["id", "durationMinutes", "lessonDate", "startTime"],
      },
    ],
  });

  for (const attendance of staleAttendances) {
    const lesson = attendance.lesson;

    // Skip if missing required data
    if (
      !lesson?.durationMinutes ||
      !attendance.joinTime ||
      !attendance.userId ||
      !attendance.lessonId
    ) {
      continue;
    }

    const minutesAttended = minutesLeftFromNow(new Date(attendance.joinTime));
    if (minutesAttended !== null && minutesAttended >= lesson.durationMinutes) {
      await leaveLessonRoom(attendance.userId, attendance.lessonId, attendance);
    }
  }
};

export const cleanupEndedLessons = async () => {
  const now = new Date();

  // Case 1 — lessons that are live but end time has passed
  const liveLessons = await Lesson.findAll({
    where: { isLive: true },
  });

  for (const lesson of liveLessons) {
    if (!lesson.lessonDate || !lesson.endTime || !lesson.id) continue;

    const lessonEndDateTime = lessonDateStartTime(
      lesson.endTime,
      lesson.lessonDate,
    );

    if (lessonEndDateTime > now) continue;

    // Calculate half-duration threshold for this lesson
    const halfDuration = lesson.durationMinutes
      ? lesson.durationMinutes / 2
      : ELIGIBLE_FOR_PAYOUT_MINUTE;

    // Process each remaining attendee individually to set correct status
    const remainingAttendances = await LessonAttendance.findAll({
      where: { lessonId: lesson.id, status: LESSON_ATTENDANCE.ATTENDED },
      raw: true,
    });

    for (const a of remainingAttendances) {
      if (!a.userId || !a.joinTime) continue;

      const studentMinutes = elapsedMinutes(new Date(a.joinTime).toISOString());
      const isEligible =
        studentMinutes !== null && studentMinutes >= halfDuration;

      await LessonAttendance.update(
        {
          leaveTime: now,
          durationMinutes: studentMinutes,
          eligibleForPayout: studentMinutes === null ? null : isEligible,
          status: isEligible
            ? LESSON_ATTENDANCE.COMPLETED
            : LESSON_ATTENDANCE.LEFT,
        },
        { where: { userId: a.userId, lessonId: lesson.id } },
      );
    }

    await Lesson.update(
      { isLive: false, status: LESSON.COMPLETED },
      { where: { id: lesson.id } },
    );

    // Pay out the instructor for this completed lesson. Isolated per lesson
    // so one payout failure doesn't stop the remaining lessons in this batch
    // from being processed (the lesson is already marked completed above and
    // won't be picked up by this query again).
    try {
      await processLessonPayout(lesson);
    } catch (error) {
      console.error(
        `[cleanupEndedLessons] payout failed for lesson ${lesson.id}:`,
        error,
      );
    }
  }

  // Case 2 — lessons that never went live but end time has passed
  const staleLessons = await Lesson.findAll({
    where: {
      isLive: false,
      status: LESSON.ACTIVE,
    },
  });

  for (const lesson of staleLessons) {
    if (!lesson.lessonDate || !lesson.endTime || !lesson.id) continue;

    const lessonEndDateTime = lessonDateStartTime(
      lesson.endTime,
      lesson.lessonDate,
    );

    if (lessonEndDateTime > now) continue;

    // Mark lesson as missed
    await Lesson.update(
      { status: LESSON.MISSED },
      { where: { id: lesson.id } },
    );

    const enrollees = await fetchLessonEnrollees(lesson.id);

    if (!enrollees.length) continue;

    // Fetch all active subscription plans for enrolled users in one query
    const allSubscriptionPlans = await SubscriptionPlan.findAll({
      where: {
        userId: { [Op.in]: enrollees.map((e) => e.userId) },
        status: SUBSCRIPTION.ACTIVE,
      },
      raw: true,
    });

    // Refund credits to each enrolled student
    for (const enrollee of enrollees) {
      if (!enrollee.userId) continue;

      const activeSubscription = allSubscriptionPlans.find(
        (plan) => plan.userId === enrollee.userId,
      );

      if (activeSubscription?.id) {
        await addSubscriptionCredits(enrollee.userId, activeSubscription.id, 1);
      }
    }

    // Notify enrolled students
    await createBulkNotifications(
      enrollees
        .filter((enrollee) => enrollee.user?.id !== lesson.userId)
        .map((enrollee) => ({
          title: "Lesson Missed",
          message: `The lesson "${lesson.title}" did not take place. Your credit has been refunded.`,
          receiverId: enrollee?.user?.id ?? "",
          senderId: null,
        })),
    );
  }
};

export const processLessonPayout = async (lesson: Lesson) => {
  if (!lesson.id || !lesson.userId) return;

  const attendances = await LessonAttendance.findAll({
    where: {
      lessonId: lesson.id,
      isHost: false,
      status: LESSON_ATTENDANCE.COMPLETED,
      payoutAmount: { [Op.ne]: null },
    },
    raw: true,
  });

  if (!attendances.length) return;

  // Attendees can be on plans with different currencies, so payouts must be
  // aggregated and disbursed per currency rather than summed into one total.
  const totalsByCurrency = new Map<
    string,
    { instructorPayout: number; platformAmount: number }
  >();

  for (const a of attendances) {
    const currency = a.currency ?? DEFAULT_CURRENCY;
    const existing = totalsByCurrency.get(currency) ?? {
      instructorPayout: 0,
      platformAmount: 0,
    };

    existing.instructorPayout += Number(a.payoutAmount ?? 0);
    existing.platformAmount += Number(a.platformAmount ?? 0);
    totalsByCurrency.set(currency, existing);
  }

  const t = await sequelize.transaction();

  try {
    // Lock the lesson row so concurrent cron runs for the same lesson
    // serialize here instead of racing past the existing-payout check below.
    await Lesson.findOne({
      where: { id: lesson.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    for (const [currency, totals] of totalsByCurrency) {
      if (totals.instructorPayout <= 0) continue;

      const earningPurpose = `Lesson Earning for ${lesson.title} (${lesson.id}) [${currency}]`;

      const existingEarning = await Transaction.findOne({
        where: {
          userId: lesson.userId,
          transactionType: TRANSACTION_TYPE.EARNING,
          purpose: earningPurpose,
        },
        transaction: t,
        raw: true,
      });

      if (existingEarning) continue;

      await Promise.all([
        // Instructor earning — confirmed immediately
        createTransaction(
          {
            userId: lesson.userId,
            transactionType: TRANSACTION_TYPE.EARNING,
            reference: `EARN-${lesson.id}-${currency}`,
            currency,
            amount: totals.instructorPayout,
            status: TRANSACTION_STATUS.SUCCESSFUL,
            channel: "system",
            purpose: earningPurpose,
            lessonId: lesson.id,
          },
          t,
        ),

        // Instructor payout — pending until disbursed
        createTransaction(
          {
            userId: lesson.userId,
            transactionType: TRANSACTION_TYPE.PAYOUT,
            reference: `PAYOUT-${lesson.id}-${currency}`,
            currency,
            amount: totals.instructorPayout,
            status: TRANSACTION_STATUS.PENDING,
            channel: "system",
            purpose: `Lesson Payout for ${lesson.title} (${lesson.id}) [${currency}]`,
            lessonId: lesson.id,
          },
          t,
        ),

        // Platform earning — confirmed immediately
        createTransaction(
          {
            userId: null,
            transactionType: TRANSACTION_TYPE.EARNING,
            reference: `PLATFORM-EARN-${lesson.id}-${currency}`,
            currency,
            amount: totals.platformAmount,
            status: TRANSACTION_STATUS.SUCCESSFUL,
            channel: "system",
            purpose: `Platform Fee for ${lesson.title} (${lesson.id}) [${currency}]`,
            lessonId: lesson.id,
          },
          t,
        ),

        // Platform payout — pending until processed
        createTransaction(
          {
            userId: null,
            transactionType: TRANSACTION_TYPE.PAYOUT,
            reference: `PLATFORM-PAYOUT-${lesson.id}-${currency}`,
            currency,
            amount: totals.platformAmount,
            status: TRANSACTION_STATUS.PENDING,
            channel: "system",
            purpose: `Platform Payout for ${lesson.title} (${lesson.id}) [${currency}]`,
            lessonId: lesson.id,
          },
          t,
        ),
      ]);
    }

    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
