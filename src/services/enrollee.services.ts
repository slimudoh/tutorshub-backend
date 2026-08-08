import { Op } from "sequelize";
import {
  ENROLLEE_EXCLUDED_ATTRIBUTES,
  LESSON_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import LessonEnrollment from "../models/lessonEnrollment.models";
import Lesson from "../models/lesson.models";
import { getLessonsDependencies } from "./lesson.services";
import User from "../models/user.models";
import LessonAttendance from "../models/lessonAttendance.models";

export const getAdminEnrollees = async (
  keyword?: string,
  status?: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }],
    };
  }

  if (status) {
    where = {
      ...where,
      status,
    };
  }

  if (!offsetSize && !newPageSize) {
    return await Lesson.count({ where: { ...where } });
  }

  const lessons = await Lesson.findAll({
    where: { ...where },
    order: [["updatedAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: LESSON_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });

  const enrollments = await LessonEnrollment.findAll({
    where: {
      lessonId: { [Op.in]: lessons.map((lesson) => lesson.id) },
    },
    raw: true,
  });

  const attendance = await LessonAttendance.findAll({
    where: {
      lessonId: { [Op.in]: lessons.map((lesson) => lesson.id) },
    },
    raw: true,
  });

  lessons.forEach((lesson) => {
    lesson.enrollees = enrollments.filter(
      (e) => e.lessonId === lesson.id && lesson.userId !== e.userId,
    ).length;

    lesson.attendees = attendance.filter(
      (a) => a.lessonId === lesson.id && lesson.userId !== a.userId,
    ).length;
  });

  return getLessonsDependencies(lessons, null);
};

export const getEnrollees = async (
  userId: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (!offsetSize && !newPageSize) {
    return await Lesson.count({ where: { ...where, userId } });
  }

  const lessons = await Lesson.findAll({
    where: { ...where, userId },
    order: [["updatedAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: LESSON_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });

  const enrollments = await LessonEnrollment.findAll({
    where: {
      lessonId: { [Op.in]: lessons.map((lesson) => lesson.id) },
    },
    raw: true,
  });

  const attendance = await LessonAttendance.findAll({
    where: {
      lessonId: { [Op.in]: lessons.map((lesson) => lesson.id) },
    },
    raw: true,
  });

  lessons.forEach((lesson) => {
    lesson.enrollees = enrollments.filter(
      (e) => e.lessonId === lesson.id && lesson.userId !== e.userId,
    ).length;

    lesson.attendees = attendance.filter(
      (a) => a.lessonId === lesson.id && lesson.userId !== a.userId,
    ).length;
  });

  return getLessonsDependencies(lessons, null);
};

export const fetchLessonEnrollees = async (
  lessonId: string,
  excludeAttributes = true,
) => {
  const enrollees = await LessonEnrollment.findAll({
    where: { lessonId },
    order: [["updatedAt", "DESC"]],
    ...(excludeAttributes && {
      attributes: { exclude: ENROLLEE_EXCLUDED_ATTRIBUTES },
    }),
    raw: true,
  });

  if (!enrollees.length) return [];

  const users = await User.findAll({
    where: { id: { [Op.in]: enrollees.map((e) => e.userId) } },
    attributes: ["id", "firstName", "lastName", "country"],
    raw: true,
  });

  const lessonAttendance = await LessonAttendance.findAll({
    where: { lessonId },
    raw: true,
  });

  enrollees.forEach((enrollee) => {
    const user = users.find((u) => u.id === enrollee.userId) ?? null;

    if (user) {
      user.lessonAttendance =
        lessonAttendance.find((a) => a.userId === user.id) || null;
    }

    enrollee.user = user;
  });

  return enrollees;
};

export const fetchAttendedEnrollees = async (lessonId: string) => {
  const enrollees = await fetchLessonEnrollees(lessonId);

  return enrollees.filter(
    (enrollee) => enrollee.user?.lessonAttendance != null,
  );
};
