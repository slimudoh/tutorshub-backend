import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError, makeError } from "../services/error.services";
import {
  findLessonById,
  verifyLessonEnrollment,
  checkSeatAvailability,
  findLessonAttendance,
  enrolLesson,
} from "../services/lesson.services";
import { LESSON_ATTENDANCE, SUBSCRIPTION } from "../utils/constant";
import { findUserById } from "../services/user.services";
import { elapsedMinutes } from "../utils/formatter";
import {
  findFreePlan,
  findUsersSubscriptionPlans,
} from "../services/pricing.services";
import { CustomRequest } from "../types/user";
import {
  exportRoomChat,
  exportRoomTranscripts,
  getRoom,
  joinLessonRoom,
  leaveLessonRoom,
} from "../services/room.services";

export const joinLessonLectureRoom: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const userId = (request as CustomRequest).user?.id;

    const [user, checkAttendance, lesson, subscriptionPlans, freePlan] =
      await Promise.all([
        findUserById(userId),
        findLessonAttendance(userId, id),
        findLessonById(id, userId),
        findUsersSubscriptionPlans(userId),
        findFreePlan(),
      ]);

    if (!lesson?.id) {
      return next(makeError("Lesson not found.", 404));
    }

    if (!lesson.lessonDate || !lesson.startTime) {
      return next(makeError("Lesson date or start time not found.", 404));
    }

    const isInstructor = lesson.userId === userId;

    if (
      checkAttendance?.status === LESSON_ATTENDANCE.ATTENDED ||
      checkAttendance?.status === LESSON_ATTENDANCE.LEFT
    ) {
      const data = await joinLessonRoom(
        userId,
        `${user?.firstName} ${user?.lastName}`,
        `${user?.firstName?.[0]}${user?.lastName?.[0]}`,
        id,
        isInstructor,
        null,
      );

      return response.status(200).json({
        data: {
          roomName: lesson.id,
          displayName: `${user?.firstName} ${user?.lastName}`,
          isInstructor,
          link: data.link,
          token: data.token,
        },
      });
    }

    if (isInstructor) {
      const data = await joinLessonRoom(
        userId,
        `${user?.firstName} ${user?.lastName}`,
        `${user?.firstName?.[0]}${user?.lastName?.[0]}`,
        id,
        true,
        null,
      );
      return response.status(200).json({
        data: {
          roomName: lesson.id,
          displayName: `${user?.firstName} ${user?.lastName}`,
          isInstructor: true,
          link: data.link,
          token: data.token,
        },
      });
    }

    const timePassed = elapsedMinutes(lesson.startTime);

    const lateJoinWindow =
      lesson.lateJoinMinutes ?? lesson.durationMinutes ?? 60;
    const canJoin = timePassed >= 0 && timePassed <= lateJoinWindow;

    if (!canJoin) {
      if (timePassed < 0) {
        return next(makeError("This lesson has not started yet.", 400));
      }
      return next(
        makeError("The join window for this lesson has closed.", 400),
      );
    }

    if (!lesson.userId) {
      return next(makeError("Lesson instructor not found.", 404));
    }

    // const instructorAttendance = await findLessonAttendance(lesson.userId, id);
    // if (instructorAttendance?.status !== LESSON_ATTENDANCE.ATTENDED) {
    //   return next(
    //     makeError("Waiting for instructor to start the session.", 403),
    //   );
    // }

    const activeSubscription = subscriptionPlans.find(
      (plan) => plan.status === SUBSCRIPTION.ACTIVE,
    );

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

      const data = await joinLessonRoom(
        userId,
        `${user?.firstName} ${user?.lastName}`,
        `${user?.firstName?.[0]}${user?.lastName?.[0]}`,
        id,
        false,
        activeSubscription.planId,
      );
      return response.status(200).json({
        data: {
          roomName: lesson.id,
          displayName: `${user?.firstName} ${user?.lastName}`,
          isInstructor: false,
          link: data.link,
          token: data.token,
        },
      });
    }

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
    const data = await joinLessonRoom(
      userId,
      `${user?.firstName} ${user?.lastName}`,
      `${user?.firstName?.[0]}${user?.lastName?.[0]}`,
      id,
      false,
      activeSubscription.planId,
    );

    return response.status(200).json({
      data: {
        roomName: lesson.id,
        displayName: `${user?.firstName} ${user?.lastName}`,
        isInstructor: false,
        link: data.link,
        token: data.token,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const leaveLessonLectureRoom: RequestHandler = async (
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

export const exportLessonRoomChat: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { roomId } = request.params;

    const chatResponse = await exportRoomChat(roomId);

    response.status(200).json({
      data: chatResponse,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const exportLessonRoomTranscripts: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { roomId } = request.params;

    const transcriptsResponse = await exportRoomTranscripts(roomId);

    response.status(200).json({
      data: transcriptsResponse,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getLessonRoom: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { roomId } = request.params;

    const roomResponse = await getRoom(roomId);

    response.status(200).json({
      data: roomResponse,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
