import Lesson from "../models/lesson.models";
import LessonAttendance from "../models/lessonAttendance.models";
import { elapsedMinutes } from "../utils/formatter";
import {
  LESSON_ATTENDANCE,
  DEFAULT_CURRENCY,
  ELIGIBLE_FOR_PAYOUT_MINUTE,
} from "../utils/constant";
import { findLessonAttendance } from "./lesson.services";
import { findPricingPlanById } from "./pricing.services";
import digitalSambaAxiosInstance from "./digitalSamba.services";

export const joinLessonRoom = async (
  userId: string,
  userName: string,
  userInitials: string,
  lessonId: string,
  isHost: boolean,
  planId: string | null,
) => {
  const checkAttendance = await findLessonAttendance(userId, lessonId);

  if (checkAttendance) {
    await LessonAttendance.update(
      { joinTime: new Date(), status: LESSON_ATTENDANCE.ATTENDED },
      { where: { userId, lessonId } },
    );

    if (isHost) {
      await Lesson.update({ isLive: true }, { where: { id: lessonId } });
    }
    const tokenResponse = await digitalSambaAxiosInstance.post(
      `api/v1/rooms/${lessonId}/token`,
      {
        ud: userId,
        u: userName,
        initials: userInitials,
        role: isHost ? "moderator" : "attendee",
      },
    );

    return {
      token: tokenResponse.data.token,
      link: tokenResponse.data.link,
    };
  }

  let instructorPayout: number | null = null;
  let platformAmount: number | null = null;

  let plan = null;

  if (planId) {
    plan = await findPricingPlanById(planId);
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

  await LessonAttendance.create({
    id: crypto.randomUUID(),
    userId,
    lessonId,
    joinTime: new Date(),
    currency: isHost ? null : (plan?.currency ?? DEFAULT_CURRENCY),
    payoutAmount: isHost ? null : instructorPayout,
    platformAmount: isHost ? null : platformAmount,
    isHost,
    status: LESSON_ATTENDANCE.ATTENDED,
  });

  // if (isHost) {
  await Lesson.update({ isLive: true }, { where: { id: lessonId } });
  // }

  const tokenResponse = await digitalSambaAxiosInstance.post(
    `api/v1/rooms/${lessonId}/token`,
    {
      ud: userId,
      u: userName,
      initials: userInitials,
      role: isHost ? "moderator" : "attendee",
    },
  );

  return {
    token: tokenResponse.data.token,
    link: tokenResponse.data.link,
  };
};

export const leaveLessonRoom = async (
  userId: string,
  lessonId: string,
  attendance: LessonAttendance,
) => {
  const durationMinutes = attendance?.joinTime
    ? elapsedMinutes(new Date(attendance.joinTime).toISOString())
    : null;

  // Fetch lesson to get the scheduled duration for the threshold
  const lesson = await Lesson.findOne({
    where: { id: lessonId },
    attributes: ["durationMinutes"],
    raw: true,
  });

  // Eligible if student stayed for at least half the scheduled lesson duration
  const halfDuration = lesson?.durationMinutes
    ? lesson.durationMinutes / 2
    : ELIGIBLE_FOR_PAYOUT_MINUTE; // fallback to fixed constant if no duration

  const isEligible =
    durationMinutes !== null && durationMinutes >= halfDuration;

  const attendanceStatus = attendance.isHost
    ? LESSON_ATTENDANCE.COMPLETED
    : isEligible
      ? LESSON_ATTENDANCE.COMPLETED
      : LESSON_ATTENDANCE.LEFT;

  await LessonAttendance.update(
    {
      leaveTime: new Date(),
      durationMinutes,
      eligibleForPayout: durationMinutes === null ? null : isEligible,
      status: attendanceStatus,
    },
    { where: { userId, lessonId } },
  );

  if (attendance.isHost) {
    const remainingAttendances = await LessonAttendance.findAll({
      where: { lessonId, status: LESSON_ATTENDANCE.ATTENDED },
      raw: true,
    });

    for (const a of remainingAttendances) {
      if (!a.userId || !a.joinTime) continue;

      const studentMinutes = elapsedMinutes(new Date(a.joinTime).toISOString());
      const studentEligible =
        studentMinutes !== null && studentMinutes >= halfDuration;

      await LessonAttendance.update(
        {
          leaveTime: new Date(),
          durationMinutes: studentMinutes,
          eligibleForPayout: studentMinutes === null ? null : studentEligible,
          status: studentEligible
            ? LESSON_ATTENDANCE.COMPLETED
            : LESSON_ATTENDANCE.LEFT,
        },
        { where: { userId: a.userId, lessonId } },
      );
    }

    await Lesson.update({ isLive: false }, { where: { id: lessonId } });
    return true;
  }

  const remaining = await LessonAttendance.count({
    where: { lessonId, status: LESSON_ATTENDANCE.ATTENDED },
  });

  if (remaining === 0) {
    await Lesson.update({ isLive: false }, { where: { id: lessonId } });
  }

  return true;
};

export const exportRoomChat = async (roomId: string) => {
  const response = await digitalSambaAxiosInstance.get(
    `api/v1/rooms/${roomId}/chat/export`,
  );

  return response.data;
};

export const exportRoomTranscripts = async (roomId: string) => {
  const response = await digitalSambaAxiosInstance.get(
    `api/v1/rooms/${roomId}/transcripts/export`,
  );

  return response.data;
};

export const getRoom = async (roomId: string) => {
  const response = await digitalSambaAxiosInstance.get(
    `api/v1/rooms/${roomId}`,
  );

  return response.data;
};

export const createRoom = async (
  id: string,
  identifier: string,
  maxParticipants: number,
) => {
  const response = await digitalSambaAxiosInstance.post(`api/v1/rooms`, {
    description: "A room for learning.",
    friendly_url: identifier,
    privacy: "private",
    external_id: id,
    default_role: "attendee",
    roles: ["moderator", "speaker", "attendee"],
    max_participants: maxParticipants,
  });

  console.log({ response });

  return response.data;
};

export const updateRoom = async (
  roomId: string,
  identifier: string,
  maxParticipants: number,
) => {
  const response = await digitalSambaAxiosInstance.patch(
    `api/v1/rooms/${roomId}`,
    {
      description: "A room for learning.",
      friendly_url: identifier,
      privacy: "private",
      default_role: "attendee",
      roles: ["moderator", "speaker", "attendee"],
      max_participants: maxParticipants,
    },
  );

  return response.data;
};

export const getRoomParticipants = async (roomId: string) => {
  const response = await digitalSambaAxiosInstance.get(
    `api/v1/rooms/${roomId}/participants`,
  );

  return response.data;
};

export const startRoomRecording = async (roomId: string) => {
  const response = await digitalSambaAxiosInstance.post(
    `api/v1/rooms/${roomId}/recordings/start`,
  );

  return response.data;
};

export const stopRoomRecording = async (roomId: string) => {
  const response = await digitalSambaAxiosInstance.post(
    `api/v1/rooms/${roomId}/recordings/stop`,
  );

  return response.data;
};
