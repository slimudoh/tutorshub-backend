import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
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
  addLessonInformation,
  findLessonBySlug,
  updateLessonInformation,
  fetchLessonsByInstructor,
  verifyFreeLessonsByInstructorId,
  verifyLessonEnrollment,
  checkSeatAvailability,
  cancelLesson,
  sendUserLessonNotification,
  leaveLessonRoom,
  findLessonAttendance,
  joinLessonRoom,
  enrolLesson,
} from "../services/lesson.services";
import {
  LESSON,
  LESSON_ATTENDANCE,
  MAIL_CONFIG,
  MAX_PARTICIPANT_PER_FREE_LESSON,
  MAX_PARTICIPANT_PER_PAID_LESSON,
  SUBSCRIPTION,
} from "../utils/constant";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById, getAllActiveUsers } from "../services/user.services";
import { findCategoryBySlug } from "../services/category.services";
import { sendMultipleMails } from "../services/email.services";
import { createBulkNotifications } from "../services/notification.services";
import { resolveOptionalUserId, verifyToken } from "../services/auth.services";
import { findInstructorByUserId } from "../services/instructor.services";
import {
  elapsedMinutes,
  lessonDateStartTime,
  isPastLesson,
  paginationHelper,
} from "../utils/formatter";
import {
  findFreePlan,
  findUsersSubscriptionPlans,
} from "../services/pricing.services";
import { differenceInHours } from "date-fns";
import { fetchLessonEnrollees } from "../services/enrollee.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

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

    if (
      lesson.status === LESSON.SUSPENDED ||
      lesson.status === LESSON.DEACTIVATED
    ) {
      return next(
        makeError(
          "Lesson is SUSPENDED or DEACTIVATED. Please contact the admin for information.",
          400,
        ),
      );
    }

    const newStatus =
      status === LESSON.ACTIVATE ? LESSON.ACTIVE : LESSON.IN_ACTIVE;

    if (lesson.status === newStatus) {
      return next(
        makeError(
          "Lesson is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    const hasFreeLessonThisMonth =
      await verifyFreeLessonsByInstructorId(reviewerId);
    if (hasFreeLessonThisMonth && lesson.isFree) {
      return next(
        makeError(
          "You can only create one free lesson per month. Please create a paid lesson instead.",
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
    const lesson = await fetchAllInstructorLessons(userId);

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
      participants,
      description,
      freeLesson,
      lectures,
      seoTitle,
      seoDescription,
      seoTags,
      fileName,
    } = request.body;

    const hasFreeLessonThisMonth =
      await verifyFreeLessonsByInstructorId(userId);
    if (
      !validateParticipantLimits(
        freeLesson,
        Number(participants),
        hasFreeLessonThisMonth,
        next,
      )
    ) {
      return;
    }

    const [lesson, user, users] = await Promise.all([
      addLessonInformation(
        userId,
        title,
        category,
        level,
        language,
        duration,
        lateJoinMinutes,
        lessonDate,
        startTime,
        endTime,
        participants,
        description,
        freeLesson,
        lectures,
        seoTitle,
        seoDescription,
        seoTags,
        request.file?.filename ?? fileName,
      ),
      findUserById(userId),
      getAllActiveUsers(),
    ]);

    await Promise.all([
      createBulkNotifications(
        users
          .filter((usr) => usr.emailAddress !== user?.emailAddress)
          .map((usr) => ({
            title: "New Lesson",
            message: `A new lesson has been created ${title} by ${user?.firstName} ${user?.lastName}.`,
            receiverId: usr.id ?? "",
            senderId: null,
          })),
      ),
      createAuditLog({
        user: JSON.stringify(user),
        action: "CREATE LESSON",
        newData: JSON.stringify(lesson),
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

    const hasFreeLessonThisMonth =
      await verifyFreeLessonsByInstructorId(userId);
    if (
      !validateParticipantLimits(
        freeLesson,
        Number(participants),
        hasFreeLessonThisMonth,
        next,
      )
    ) {
      return;
    }

    const updatedLesson = await updateLessonInformation(
      id,
      title,
      category,
      level,
      language,
      duration,
      lateJoinMinutes,
      lessonDate,
      startTime,
      endTime,
      participants,
      description,
      freeLesson,
      lectures,
      seoTitle,
      seoDescription,
      seoTags,
      request.file?.filename ?? fileName,
    );

    const [user, enrollees] = await Promise.all([
      findUserById(userId),
      fetchLessonEnrollees(id),
    ]);

    await Promise.all([
      createBulkNotifications(
        enrollees
          .filter((enrollee) => enrollee.user?.id !== userId)
          .map((enrollee) => ({
            title: "Lesson Updated",
            message: `The lesson ${title} has been updated by ${user?.firstName} ${user?.lastName}.`,
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

export const lessonJoinRoom: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const userId = (request as CustomRequest).user?.id;

    const [checkAttendance, lesson, subscriptionPlans, freePlan] =
      await Promise.all([
        findLessonAttendance(userId, id),
        findLessonById(id, userId),
        findUsersSubscriptionPlans(userId),
        findFreePlan(),
      ]);

    if (checkAttendance?.status === LESSON_ATTENDANCE.ATTENDED) {
      return next(makeError("You have already joined this lesson.", 400));
    }

    if (!lesson?.id) {
      return next(makeError("Lesson not found.", 404));
    }

    if (!lesson.lessonDate || !lesson.startTime) {
      return next(makeError("Lesson date or start time not found.", 404));
    }

    const activeSubscription = subscriptionPlans.find(
      (plan) => plan.status === SUBSCRIPTION.ACTIVE,
    );

    const timePassed = elapsedMinutes(lesson.startTime);
    const canJoin = timePassed <= (lesson.lateJoinMinutes ?? 0);
    const lessonHasPassed = isPastLesson(lesson.lessonDate, lesson.startTime);

    if (!lessonHasPassed || !canJoin) {
      return next(makeError("You can no longer join this lesson.", 400));
    }

    // Host path
    if (lesson.userId === userId) {
      const joinLink = await joinLessonRoom(userId, id, true, null);
      return response.status(200).json({ data: { joinLink, isHost: true } });
    }

    // Enrolled participant path
    const alreadyEnrolled = await verifyLessonEnrollment(userId, id);
    if (alreadyEnrolled) {
      if (!activeSubscription?.id) {
        return next(
          makeError(
            "You do not have an active subscription. Please subscribe to a plan and try again.",
            400,
          ),
        );
      }
      const joinLink = await joinLessonRoom(
        userId,
        id,
        false,
        activeSubscription.planId,
      );
      return response.status(200).json({ data: { joinLink, isHost: false } });
    }

    // Walk-in participant path — validate seat and subscription before enrolling
    const availableSeat = await checkSeatAvailability(id);
    if (!availableSeat) {
      return next(makeError("No available seat for this lesson.", 400));
    }

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
    const joinLink = await joinLessonRoom(
      userId,
      id,
      false,
      activeSubscription.planId,
    );
    response.status(200).json({ data: { joinLink, isHost: false } });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const lessonLeaveRoom: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const userId = (request as CustomRequest).user?.id;

    const checkAttendance = await findLessonAttendance(userId, id);
    if (!checkAttendance) {
      return next(makeError("You have not joined this lesson yet.", 400));
    }

    await leaveLessonRoom(userId, id, checkAttendance);

    response.status(200).json({
      message: "Lesson left successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const sendLessonNotification: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    await sendUserLessonNotification();

    response.status(200).json({
      message: "Lesson notification sent successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
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
