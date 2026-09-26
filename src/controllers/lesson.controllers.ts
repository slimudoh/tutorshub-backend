import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError, makeError } from "../services/error.services";
import {
  findLessonById,
  getActiveLessons,
  getAdminLessons,
  fetchLessonHistory,
  getUserLessons,
  updateLessonStatus,
  fetchLiveLessons,
  getActiveHomeLessons,
  fetchLessonsByCategory,
  fetchAllInstructorLessons,
  findLessonBySlug,
  updateLessonInformation,
  fetchLessonsByInstructor,
  verifyFreeLessonsByInstructorId,
  verifyLessonEnrollment,
  checkSeatAvailability,
  checkEnrollmentTimeClash,
  cancelLesson,
  cancelLessonEnrollments,
  enrolLesson,
  findLessonByDateTime,
  addLessonInformation,
  fetchLessonsSeries,
  getUserLessonSeries,
} from "../services/lesson.services";
import {
  addDays,
  format,
  parseISO,
  startOfDay,
  differenceInHours,
} from "date-fns";
import {
  LESSON,
  lessonFrequencies,
  MAX_LESSONS_AT_ONCE,
  MAX_PARTICIPANT_PER_FREE_LESSON,
  MAX_PARTICIPANT_PER_PAID_LESSON,
  SUBSCRIPTION,
} from "../utils/constant";
import { createAuditLog } from "../services/auditLog.services";
import { findAllActiveUsers, findUserById } from "../services/user.services";
import { findCategoryBySlug } from "../services/category.services";
import { createBulkNotifications } from "../services/notification.services";
import { resolveOptionalUserId } from "../services/auth.services";
import { findInstructorByUserId } from "../services/instructor.services";
import {
  lessonDateStartTime,
  isPastLesson,
  minutesLeftFromNow,
  paginationHelper,
  toSlug,
  generateDates,
  generateShortId,
} from "../utils/formatter";
import {
  addSubscriptionCredits,
  findFreePlan,
  findUsersSubscriptionPlans,
} from "../services/pricing.services";
import { fetchLessonEnrollees } from "../services/enrollee.services";
import SubscriptionPlan from "../models/subscriptionPlan.models";
import { Op } from "@sequelize/core";
import { CustomRequest } from "../types";
import sequelize from "../utils/db";

export const getAllLessons: RequestHandler = async (
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

    const [lessons, totalRecords] = await Promise.all([
      getAdminLessons(
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
      ),
      getAdminLessons(keyword as string, status as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewAdminLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const reviewerId = (request as CustomRequest).user?.id;

    const { id, status } = request.body;

    if (status !== LESSON.ACTIVATE && status !== LESSON.SUSPEND) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const [lesson, reviewer] = await Promise.all([
      findLessonById(id, reviewerId),
      findUserById(reviewerId),
    ]);

    if (!lesson) {
      return next(makeError("Lesson not found. Please try again later.", 404));
    }

    const newStatus =
      status === LESSON.ACTIVATE ? LESSON.ACTIVE : LESSON.SUSPENDED;

    if (lesson.status === newStatus) {
      return next(
        makeError(
          "Lesson is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    await updateLessonStatus(id, newStatus);

    await createAuditLog({
      user: JSON.stringify(reviewer),
      action: "REVIEW LESSON",
      oldData: JSON.stringify(lesson),
      newData: JSON.stringify({ ...lesson, status: newStatus }),
      section: "LESSON",
    });

    if (newStatus === LESSON.SUSPENDED && lesson.id) {
      const enrollees = await fetchLessonEnrollees(lesson.id);

      if (enrollees.length) {
        // Cancel all active enrollments for this lesson
        await cancelLessonEnrollments(lesson.id);

        const allSubscriptionPlans = await SubscriptionPlan.findAll({
          where: {
            userId: { [Op.in]: enrollees.map((e) => e.userId) },
            status: SUBSCRIPTION.ACTIVE,
          },
          raw: true,
        });

        for (const enrollee of enrollees) {
          if (!enrollee.userId) continue;

          const activeSubscription = allSubscriptionPlans.find(
            (plan) => plan.userId === enrollee.userId,
          );

          if (activeSubscription?.id) {
            await addSubscriptionCredits(
              enrollee.userId,
              activeSubscription.id,
              1,
            );
          }
        }

        await createBulkNotifications(
          enrollees
            .filter((enrollee) => enrollee.user?.id !== lesson.userId)
            .map((enrollee) => ({
              title: "Lesson Cancelled",
              message: `The lesson "${lesson.title}" has been suspended. Your credit has been refunded.`,
              receiverId: enrollee?.user?.id ?? "",
              senderId: null,
            })),
        );
      }
    }

    response.status(200).json({ message: "Lesson reviewed successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewInstructorLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const reviewerId = (request as CustomRequest).user?.id;
    const { id, status } = request.body;

    const validStatuses = [LESSON.ACTIVATE, LESSON.SUSPEND];
    if (!validStatuses.includes(status)) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const [lesson, reviewer] = await Promise.all([
      findLessonById(id, reviewerId),
      findUserById(reviewerId),
    ]);

    if (!lesson?.id) {
      return next(makeError("Lesson not found. Please try again later.", 404));
    }

    const statusMap: Record<string, string> = {
      [LESSON.ACTIVATE]: LESSON.ACTIVE,
      [LESSON.SUSPEND]: LESSON.SUSPENDED,
    };

    const newStatus = statusMap[status];

    if (lesson.status === newStatus) {
      return next(
        makeError(
          "Lesson is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    if (
      status === LESSON.ACTIVATE &&
      (lesson.status === LESSON.SUSPENDED ||
        lesson.status === LESSON.DEACTIVATED)
    ) {
      return next(
        makeError(
          "Lesson is SUSPENDED or DEACTIVATED. Please contact the admin for more information.",
          400,
        ),
      );
    }

    // Fixed: verifyFreeLessonsByInstructorId expects the Lesson object, not just userId
    if (status === LESSON.ACTIVATE && lesson.isFree && lesson.userId) {
      const hasAnotherFreeLessonThisMonth =
        await verifyFreeLessonsByInstructorId(lesson.userId);

      if (hasAnotherFreeLessonThisMonth) {
        return next(
          makeError(
            "This instructor already has an active free lesson this month. Only one free lesson is allowed per month.",
            400,
          ),
        );
      }
    }

    await updateLessonStatus(id, newStatus);

    await createAuditLog({
      user: JSON.stringify(reviewer),
      action: "REVIEW LESSON",
      oldData: JSON.stringify(lesson),
      newData: JSON.stringify({ ...lesson, status: newStatus }),
      section: "LESSON",
    });

    const shouldRefund =
      newStatus === LESSON.SUSPENDED || newStatus === LESSON.DEACTIVATED;

    if (shouldRefund) {
      const enrollees = await fetchLessonEnrollees(lesson.id);

      if (enrollees.length) {
        // Cancel all active enrollments for this lesson
        await cancelLessonEnrollments(lesson.id);

        const allSubscriptionPlans = await SubscriptionPlan.findAll({
          where: {
            userId: { [Op.in]: enrollees.map((e) => e.userId) },
            status: SUBSCRIPTION.ACTIVE,
          },
          raw: true,
        });

        for (const enrollee of enrollees) {
          if (!enrollee.userId) continue;

          const activeSubscription = allSubscriptionPlans.find(
            (plan) => plan.userId === enrollee.userId,
          );

          if (activeSubscription?.id) {
            await addSubscriptionCredits(
              enrollee.userId,
              activeSubscription.id,
              1,
            );
          }
        }

        const actionLabel =
          newStatus === LESSON.SUSPENDED ? "suspended" : "deactivated";

        await createBulkNotifications(
          enrollees
            .filter((enrollee) => enrollee.user?.id !== lesson.userId)
            .map((enrollee) => ({
              title: "Lesson Cancelled",
              message: `The lesson "${lesson.title}" has been ${actionLabel}. Your credit has been refunded.`,
              receiverId: enrollee?.user?.id ?? "",
              senderId: null,
            })),
        );
      }
    }

    response.status(200).json({ message: "Lesson reviewed successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllActiveLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = await resolveOptionalUserId(request);

    const { status, keyword, pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [lessons, totalRecords] = await Promise.all([
      getActiveLessons(
        status as string,
        keyword as string,
        userId,
        offsetSize,
        newPageSize,
      ),
      getActiveLessons(
        status as string,
        keyword as string,
        userId,
      ) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllUserLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { keyword, pageNumber, pageSize, status } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [lessons, totalRecords] = await Promise.all([
      getUserLessons(
        userId,
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
      ),
      getUserLessons(
        userId,
        keyword as string,
        status as string,
      ) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllUserLessonSeries: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const userId = (request as CustomRequest).user?.id;

    const lessons = await getUserLessonSeries(userId, id);

    response.status(200).json({
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLiveLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = await resolveOptionalUserId(request);
    const lessons = await fetchLiveLessons(userId);

    response.status(200).json({
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLessonsSeries: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const userId = await resolveOptionalUserId(request);
    const lessons = await fetchLessonsSeries(id, userId);

    response.status(200).json({
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLessonHistory: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { keyword, pageNumber, pageSize } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [lessonHistories, totalRecords] = await Promise.all([
      fetchLessonHistory(userId, keyword as string, offsetSize, newPageSize),
      fetchLessonHistory(userId, keyword as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: lessonHistories,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getHomeLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = await resolveOptionalUserId(request);
    const lessons = await getActiveHomeLessons(userId);

    response.status(200).json({
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLessonsByCategory: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = await resolveOptionalUserId(request);

    const { slug } = request.params;
    const { pageNumber, pageSize, keyword } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const category = await findCategoryBySlug(slug);
    if (!category?.id) {
      return next(makeError("Category not found.", 404));
    }

    const [lessons, totalRecords] = await Promise.all([
      fetchLessonsByCategory(
        category.id,
        userId,
        keyword as string,
        offsetSize,
        newPageSize,
      ),
      fetchLessonsByCategory(category.id, keyword as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLessonsByInstructor: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = await resolveOptionalUserId(request);
    const { id } = request.params;
    const { pageNumber, pageSize, keyword } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const instructor = await findInstructorByUserId(id);

    if (!instructor?.userId) {
      return next(makeError("Instructor not found.", 404));
    }

    const [lessons, totalRecords] = await Promise.all([
      fetchLessonsByInstructor(
        userId,
        instructor.userId,
        keyword as string,
        offsetSize,
        newPageSize,
      ),
      fetchLessonsByInstructor(
        instructor.userId,
        keyword as string,
      ) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: lessons,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllInstructorLessons: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { keyword } = request.query;

    const lesson = await fetchAllInstructorLessons(userId, keyword as string);

    response.status(200).json({
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const submitNewLesson: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const {
      title,
      category,
      level,
      language,
      duration,
      lateJoinMinutes,
      lessonDate,
      startTime,
      endTime,
      lessonTotal,
      frequency,
      weeklyDays,
      customDates,
      participants,
      description,
      freeLesson,
      lectures,
      seoTitle,
      seoDescription,
      seoTags,
      fileName,
    } = request.body;

    if (!title || !category || !level || !language) {
      return next(makeError("Required fields are missing.", 400));
    }

    if (!lessonFrequencies.includes(frequency)) {
      return next(makeError("Invalid frequency. Please try again later.", 400));
    }

    const numParticipants = Number(participants);
    const numLessonTotal = Number(lessonTotal);
    const numDuration = Number(duration);
    const numLateJoinMinutes = Number(lateJoinMinutes);

    if (
      isNaN(numParticipants) ||
      isNaN(numLessonTotal) ||
      isNaN(numDuration) ||
      isNaN(numLateJoinMinutes)
    ) {
      return next(makeError("Invalid numeric values provided.", 400));
    }

    if (numParticipants <= 0) {
      return next(makeError("Participants must be greater than 0.", 400));
    }

    if (numDuration <= 0) {
      return next(makeError("Duration must be greater than 0.", 400));
    }

    if (numLateJoinMinutes < 0) {
      return next(makeError("Late join minutes cannot be negative.", 400));
    }

    if (frequency === "daily" || frequency === "weekly") {
      if (isNaN(numLessonTotal) || numLessonTotal <= 0) {
        return next(makeError("Lesson total must be a positive number.", 400));
      }

      if (numLessonTotal > MAX_LESSONS_AT_ONCE) {
        return next(
          makeError(
            `You can create at most ${MAX_LESSONS_AT_ONCE} lessons at once. Please reduce the lesson total and try again.`,
            400,
          ),
        );
      }
    }

    const newWeekDays = weeklyDays ? JSON.parse(weeklyDays) : [];

    if (frequency === "weekly" && newWeekDays.length > 0) {
      const invalidDays = newWeekDays.filter(
        (day: number) => day < 0 || day > 6 || !Number.isInteger(day),
      );

      if (invalidDays.length > 0) {
        return next(
          makeError(
            "Weekly days must be integers between 0 (Sunday) and 6 (Saturday).",
            400,
          ),
        );
      }
    }

    const newCustomDays = customDates ? JSON.parse(customDates) : [];

    if (
      frequency === "custom" &&
      (!newCustomDays || newCustomDays.length === 0)
    ) {
      return next(
        makeError("Custom dates are required for custom frequency.", 400),
      );
    }

    const lessonDateTime = lessonDateStartTime(startTime, lessonDate);
    if (!lessonDateTime) {
      return next(makeError("Invalid lesson date or start time format.", 400));
    }

    const lessonEndTime = lessonDateStartTime(endTime, lessonDate);
    if (!lessonEndTime) {
      return next(makeError("Invalid lesson date or end time format.", 400));
    }

    if (lessonEndTime <= lessonDateTime) {
      return next(makeError("End time must be after start time.", 400));
    }

    // Generate all lesson dates based on frequency
    const allLessonDates: string[] = [];
    if (frequency === "once") {
      allLessonDates.push(lessonDate);
    } else if (frequency === "daily" && numLessonTotal > 0) {
      const today = startOfDay(new Date());
      allLessonDates.push(
        ...Array.from({ length: numLessonTotal }, (_, i) =>
          format(addDays(today, i), "yyyy-MM-dd"),
        ),
      );
    } else if (frequency === "weekly" && newWeekDays.length > 0) {
      const selectedDate = parseISO(lessonDate);
      const today = startOfDay(new Date());
      const allowedDaySet: Set<number> = new Set(newWeekDays);
      const dateStrings = generateDates(
        selectedDate,
        numLessonTotal,
        today,
        allowedDaySet,
      );
      allLessonDates.push(...dateStrings.map((d) => d.date));
    } else if (
      frequency === "custom" &&
      newCustomDays &&
      newCustomDays.length > 0
    ) {
      allLessonDates.push(...newCustomDays.map((date: string) => date));
    }

    // Check all dates for conflicts
    const conflictChecks = allLessonDates.map((date) =>
      findLessonByDateTime(date, startTime, endTime),
    );
    const conflictResults = await Promise.all(conflictChecks);

    const hasConflict = conflictResults.some((result) => result !== null);

    if (hasConflict) {
      return next(
        makeError(
          `One or more lesson dates conflict with existing lesson's time or date. Please review your existing lessons time and date and try again.`,
          409,
        ),
      );
    }

    if (lessonDateTime <= new Date()) {
      return next(
        makeError("Lesson date and time must be in the future.", 400),
      );
    }

    const hasFreeLessonThisMonth =
      await verifyFreeLessonsByInstructorId(userId);

    if (
      !validateParticipantLimits(
        freeLesson,
        numParticipants,
        hasFreeLessonThisMonth,
        next,
      )
    ) {
      return;
    }

    const payload: any = {
      userId,
      title,
      category,
      level,
      language,
      duration: numDuration.toString(),
      lateJoinMinutes: numLateJoinMinutes.toString(),
      lessonDate,
      startTime,
      endTime,
      participants: numParticipants,
      description,
      freeLesson,
      lectures,
      seoTitle,
      seoDescription,
      seoTags,
      file: request.file?.filename ?? fileName,
    };

    const transaction = await sequelize.transaction();
    let lessons: any = null;

    try {
      let slug = toSlug(title);
      let seriesId = numLessonTotal > 1 ? crypto.randomUUID() : null,
        lessons = await Promise.all(
          allLessonDates.map((ld) => {
            return addLessonInformation(
              {
                ...payload,
                slug: slug + "-" + generateShortId(),
                lessonDate: ld,
              },
              seriesId,
              transaction,
            );
          }),
        );

      if (!lessons || (Array.isArray(lessons) && lessons.length === 0)) {
        throw new Error("Failed to create lesson.");
      }

      await transaction.commit();
    } catch (err: any) {
      await transaction.rollback();

      // Handle duplicate key error specifically
      if (err?.code === "ER_DUP_ENTRY" || err?.errno === 1062) {
        return next(
          makeError(
            "A lesson with this slug already exists. Please try again.",
            409,
          ),
        );
      }

      const error = createServerError(err as Error, 500);
      return next(error);
    }

    const [user, users] = await Promise.all([
      findUserById(userId),
      findAllActiveUsers(),
    ]);

    if (!user) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    await Promise.all([
      createBulkNotifications(
        users
          .filter((usr) => usr.emailAddress !== user?.emailAddress)
          .map((usr) => ({
            title: "New Lesson",
            message: `A new lesson has been created ${title} by ${user?.firstName || ""} ${user?.lastName || ""}.`,
            receiverId: usr.id ?? "",
            senderId: null,
          })),
      ),
      createAuditLog({
        user: JSON.stringify(user),
        action: "CREATE LESSON",
        newData: JSON.stringify(lessons),
        section: "LESSON",
      }),
    ]);

    response.status(201).json({ message: "Lesson published successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const submitUpdatedLesson: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const {
      id,
      title,
      category,
      level,
      language,
      duration,
      lessonDate,
      startTime,
      endTime,
      lessonTotal,
      frequency,
      weeklyDays,
      customDates,
      lateJoinMinutes,
      participants,
      description,
      freeLesson,
      lectures,
      seoTitle,
      seoDescription,
      seoTags,
      fileName,
    } = request.body;

    if (!lessonFrequencies.includes(frequency)) {
      return next(makeError("Invalid frequency. Please try again later.", 400));
    }

    const verifyLesson = await findLessonById(id, userId);
    if (!verifyLesson) {
      return next(makeError("Lesson not found. Please try again later.", 404));
    }

    if (
      verifyLesson.status !== LESSON.PENDING &&
      verifyLesson.status !== LESSON.ACTIVE
    ) {
      return next(
        makeError(
          "You can only update a lesson that is in PENDING or ACTIVE status.",
          400,
        ),
      );
    }

    const numParticipants = Number(participants);
    const numLessonTotal = Number(lessonTotal);
    const numDuration = Number(duration);
    const numLateJoinMinutes = Number(lateJoinMinutes);

    if (
      isNaN(numParticipants) ||
      isNaN(numLessonTotal) ||
      isNaN(numDuration) ||
      isNaN(numLateJoinMinutes)
    ) {
      return next(makeError("Invalid numeric values provided.", 400));
    }

    if (numParticipants <= 0) {
      return next(makeError("Participants must be greater than 0.", 400));
    }

    if (numDuration <= 0) {
      return next(makeError("Duration must be greater than 0.", 400));
    }

    if (numLateJoinMinutes < 0) {
      return next(makeError("Late join minutes cannot be negative.", 400));
    }

    if (frequency === "daily" || frequency === "weekly") {
      if (isNaN(numLessonTotal) || numLessonTotal <= 0) {
        return next(makeError("Lesson total must be a positive number.", 400));
      }

      if (numLessonTotal > MAX_LESSONS_AT_ONCE) {
        return next(
          makeError(
            `You can create at most ${MAX_LESSONS_AT_ONCE} lessons at once. Please reduce the lesson total and try again.`,
            400,
          ),
        );
      }
    }

    const newWeekDays = weeklyDays ? JSON.parse(weeklyDays) : [];

    if (frequency === "weekly" && newWeekDays.length > 0) {
      const invalidDays = newWeekDays.filter(
        (day: number) => day < 0 || day > 6 || !Number.isInteger(day),
      );
      if (invalidDays.length > 0) {
        return next(
          makeError(
            "Weekly days must be integers between 0 (Sunday) and 6 (Saturday).",
            400,
          ),
        );
      }
    }

    const newCustomDays = customDates ? JSON.parse(customDates) : [];

    if (
      frequency === "custom" &&
      (!newCustomDays || newCustomDays.length === 0)
    ) {
      return next(
        makeError("Custom dates are required for custom frequency.", 400),
      );
    }

    const lessonDateTime = lessonDateStartTime(startTime, lessonDate);
    if (!lessonDateTime) {
      return next(makeError("Invalid lesson date or start time format.", 400));
    }

    const lessonEndTime = lessonDateStartTime(endTime, lessonDate);
    if (!lessonEndTime) {
      return next(makeError("Invalid lesson date or end time format.", 400));
    }

    if (lessonEndTime <= lessonDateTime) {
      return next(makeError("End time must be after start time.", 400));
    }

    const minutesUntilStart = minutesLeftFromNow(lessonDateTime);
    if (minutesUntilStart !== null && minutesUntilStart <= 30) {
      return next(
        makeError(
          "You can no longer update this lesson. Lessons cannot be updated within 30 minutes of the start time.",
          400,
        ),
      );
    }

    if (lessonDateTime <= new Date()) {
      return next(
        makeError("Lesson date and time must be in the future.", 400),
      );
    }

    // Generate all lesson dates based on frequency
    const allLessonDates: string[] = [];
    if (frequency === "once") {
      allLessonDates.push(lessonDate);
    } else if (frequency === "daily" && numLessonTotal > 0) {
      const today = startOfDay(new Date());
      allLessonDates.push(
        ...Array.from({ length: numLessonTotal }, (_, i) =>
          format(addDays(today, i), "yyyy-MM-dd"),
        ),
      );
    } else if (frequency === "weekly" && newWeekDays.length > 0) {
      const selectedDate = parseISO(lessonDate);
      const today = startOfDay(new Date());
      const allowedDaySet: Set<number> = new Set(newWeekDays);
      const dateStrings = generateDates(
        selectedDate,
        numLessonTotal,
        today,
        allowedDaySet,
      );
      allLessonDates.push(...dateStrings.map((d) => d.date));
    } else if (
      frequency === "custom" &&
      newCustomDays &&
      newCustomDays.length > 0
    ) {
      allLessonDates.push(...newCustomDays.map((date: string) => date));
    }

    // Check all dates for conflicts (excluding the current lesson being updated)
    const conflictChecks = allLessonDates.map((date) =>
      findLessonByDateTime(date, startTime, endTime, undefined, id),
    );
    const conflictResults = await Promise.all(conflictChecks);

    const hasConflict = conflictResults.some((result) => result !== null);
    if (hasConflict) {
      return next(
        makeError(
          "One or more lesson dates conflict with existing lessons.",
          409,
        ),
      );
    }

    const hasFreeLessonThisMonth =
      await verifyFreeLessonsByInstructorId(userId);

    if (
      !validateParticipantLimits(
        freeLesson,
        numParticipants,
        hasFreeLessonThisMonth,
        next,
      )
    ) {
      return;
    }

    const payload = {
      id,
      title,
      category,
      level,
      language,
      duration: numDuration.toString(),
      lateJoinMinutes: numLateJoinMinutes.toString(),
      lessonDate,
      startTime,
      endTime,
      participants: numParticipants,
      description,
      freeLesson,
      lectures,
      seoTitle,
      seoDescription,
      seoTags,
      file: request.file?.filename ?? fileName,
      externalRoomId: verifyLesson?.externalRoomId || "",
      slug: verifyLesson?.slug || "",
    };

    const transaction = await sequelize.transaction();
    let updatedLesson: any = null;

    try {
      updatedLesson = await Promise.all(
        allLessonDates.map((ld) => {
          return updateLessonInformation(
            { ...payload, lessonDate: ld },
            transaction,
          );
        }),
      );

      if (
        !updatedLesson ||
        (Array.isArray(updatedLesson) && updatedLesson.length === 0)
      ) {
        throw new Error("Failed to update lesson.");
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      const error = createServerError(err as Error, 500);
      return next(error);
    }

    const [user, enrollees] = await Promise.all([
      findUserById(userId),
      fetchLessonEnrollees(id),
    ]);

    if (!user) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    await Promise.all([
      createBulkNotifications(
        enrollees
          .filter((enrollee) => enrollee.user?.id !== userId)
          .map((enrollee) => ({
            title: "Lesson Updated",
            message: `The lesson ${title} has been updated by ${user?.firstName || ""} ${user?.lastName || ""}.`,
            receiverId: enrollee?.user?.id ?? "",
            senderId: null,
          })),
      ),
      createAuditLog({
        user: JSON.stringify(user),
        action: "UPDATE LESSON",
        newData: JSON.stringify(updatedLesson),
        section: "LESSON",
      }),
    ]);

    response.status(200).json({ message: "Lesson updated successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLesson: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const userId = await resolveOptionalUserId(request);

    let lesson = await findLessonById(id, userId);
    lesson ??= await findLessonBySlug(id, userId);

    if (!lesson) {
      return next(makeError("Lesson not found.", 404));
    }

    response.status(200).json({
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const lessonEnrollment: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const userId = (request as CustomRequest).user?.id;

    const lesson = await findLessonById(id, userId);
    if (!lesson?.id) {
      return next(makeError("Lesson not found.", 404));
    }

    if (!lesson.lessonDate || !lesson.startTime) {
      return next(makeError("Lesson date or start time not found.", 404));
    }

    if (userId === lesson.userId) {
      return next(makeError("You cannot enroll in your own lesson.", 400));
    }

    const alreadyEnrolled = await verifyLessonEnrollment(userId, id);
    if (alreadyEnrolled) {
      return next(makeError("You are already enrolled in this lesson.", 400));
    }

    const availableSeat = await checkSeatAvailability(id);
    if (!availableSeat) {
      return next(makeError("No available seat for this lesson.", 400));
    }

    if (isPastLesson(lesson.lessonDate, lesson.startTime)) {
      return next(makeError("You can no longer join this lesson.", 400));
    }

    if (lesson.endTime) {
      const hasClash = await checkEnrollmentTimeClash(userId, {
        id: lesson.id!,
        lessonDate: lesson.lessonDate,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
      });

      if (hasClash) {
        return next(
          makeError(
            "You are already enrolled in another lesson that overlaps with this time slot.",
            409,
          ),
        );
      }
    }

    const [subscriptionPlans, freePlan] = await Promise.all([
      findUsersSubscriptionPlans(userId),
      findFreePlan(),
    ]);

    const activeSubscription = subscriptionPlans.find(
      (plan) => plan.status === SUBSCRIPTION.ACTIVE,
    );

    if (!activeSubscription?.id) {
      return next(
        makeError(
          "You do not have an active subscription. Please subscribe to a plan and try again.",
          400,
        ),
      );
    }

    if (
      !activeSubscription.creditsBalance ||
      activeSubscription.creditsBalance < 1
    ) {
      return next(
        makeError(
          "You have exhausted your credits for this month. Please upgrade your subscription or top up your credits to take this lesson.",
          400,
        ),
      );
    }

    if (!lesson.isFree && freePlan?.id === activeSubscription.planId) {
      return next(
        makeError(
          "This is a paid lesson. Please upgrade your subscription to take this lesson.",
          400,
        ),
      );
    }

    await enrolLesson(userId, id, activeSubscription.id);
    response.status(200).json({ message: "Enrolled successfully." });
  } catch (err) {
    next(createServerError(err as Error, 500));
  }
};

export const cancelEnrollment: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const userId = (request as CustomRequest).user?.id;

    const lesson = await findLessonById(id, userId);
    if (!lesson?.id) {
      return next(makeError("Lesson not found.", 404));
    }

    if (!lesson.lessonDate || !lesson.startTime) {
      return next(makeError("Lesson date or start time not found.", 404));
    }

    const hoursUntilLesson = differenceInHours(
      lessonDateStartTime(lesson.startTime, lesson.lessonDate),
      new Date(),
    );

    if (hoursUntilLesson < 0) {
      return next(
        makeError(
          "You can no longer cancel this lesson as it has already started.",
          400,
        ),
      );
    }

    if (hoursUntilLesson <= 5) {
      return next(
        makeError(
          "You can no longer cancel this lesson as it is less than 5 hours away.",
          400,
        ),
      );
    }

    const enrolled = await verifyLessonEnrollment(userId, id);
    if (!enrolled) {
      return next(makeError("You are not enrolled in this lesson.", 400));
    }

    const subscriptionPlans = await findUsersSubscriptionPlans(userId);
    const activeSubscription = subscriptionPlans.find(
      (plan) => plan.status === SUBSCRIPTION.ACTIVE,
    );

    if (!activeSubscription?.id) {
      return next(
        makeError(
          "You do not have an active subscription. Please subscribe to a plan and try again.",
          400,
        ),
      );
    }

    await cancelLesson(userId, id, activeSubscription.id);

    response.status(200).json({ message: "Lesson cancelled successfully." });
  } catch (err) {
    next(createServerError(err as Error, 500));
  }
};

const validateParticipantLimits = (
  freeLesson: string,
  participants: number,
  hasFreeLessonThisMonth: boolean,
  next: NextFunction,
): boolean => {
  if (freeLesson === "true") {
    if (hasFreeLessonThisMonth) {
      next(
        makeError(
          "You can only create one free lesson per month. Please create a paid lesson instead.",
          400,
        ),
      );
      return false;
    }
    if (participants > MAX_PARTICIPANT_PER_FREE_LESSON) {
      next(
        makeError(
          `Maximum number of participants for a free lesson is ${MAX_PARTICIPANT_PER_FREE_LESSON}.`,
          400,
        ),
      );
      return false;
    }
  } else if (participants > MAX_PARTICIPANT_PER_PAID_LESSON) {
    next(
      makeError(
        `Maximum number of participants for a paid lesson is ${MAX_PARTICIPANT_PER_PAID_LESSON}.`,
        400,
      ),
    );
    return false;
  }
  return true;
};
