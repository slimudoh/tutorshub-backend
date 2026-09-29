import { Op } from "sequelize";
import { endOfDay, endOfWeek, endOfMonth } from "date-fns";
import { lessonDateStartTime } from "./formatter";
import { isAfter } from "date-fns";
import { LESSON, LESSON_ENROLLMENT, LESSON_EXCLUDED_ATTRIBUTES } from "./constant";
import Lesson from "../models/lesson.models";
import LessonEnrollment from "../models/lessonEnrollment.models";

/**
 * Time period utilities for upcoming lessons
 */
export const getTimePeriods = () => {
  const now = new Date();
  return {
    now,
    todayEnd: endOfDay(now),
    weekEnd: endOfWeek(now),
    monthEnd: endOfMonth(now),
  };
};

export type TimePeriods = ReturnType<typeof getTimePeriods>;

/**
 * Map slug to appropriate date end
 */
export const getDateEndFromSlug = (
  slug: string,
  periods: TimePeriods = getTimePeriods(),
): Date => {
  const { todayEnd, weekEnd, monthEnd } = periods;
  switch (slug) {
    case "today":
      return todayEnd;
    case "week":
      return weekEnd.getTime() < monthEnd.getTime() ? weekEnd : monthEnd;
    case "month":
      return monthEnd;
    default:
      return monthEnd;
  }
};

/**
 * Filter lessons to only those that haven't started yet
 */
export const filterUpcomingLessons = (lessons: any[]): any[] => {
  const now = new Date();
  return lessons.filter((lesson) => {
    if (!lesson.lessonDate) return false;
    const lessonDateTime = lessonDateStartTime(
      lesson.startTime || "12:00 AM",
      new Date(lesson.lessonDate),
    );
    return isAfter(lessonDateTime, now);
  });
};

/**
 * Base where clause for upcoming lessons (excludes suspended/deactivated)
 */
export const UPCOMING_LESSON_BASE_STATUS = {
  status: { [Op.notIn]: [LESSON.SUSPENDED, LESSON.DEACTIVATED] },
};

/**
 * Build where clause for different scopes
 */
export type UpcomingLessonScope = "admin" | "instructor" | "user";

export const buildUpcomingLessonWhere = async (
  scope: UpcomingLessonScope,
  userId: string | null,
  dateEnd: Date,
  periods: TimePeriods,
): Promise<any> => {
  const { now } = periods;
  const baseWhere: any = { ...UPCOMING_LESSON_BASE_STATUS };

  if (scope === "instructor" && userId) {
    baseWhere.userId = userId;
  } else if (scope === "user" && userId) {
    const enrollments = await LessonEnrollment.findAll({
      where: { userId, status: LESSON_ENROLLMENT.ACTIVE },
      attributes: ["lessonId"],
      raw: true,
    });
    if (enrollments.length > 0) {
      baseWhere.id = { [Op.in]: enrollments.map((e) => e.lessonId) };
    } else {
      return { ...baseWhere, id: { [Op.in]: [] } };
    }
  }

  return {
    ...baseWhere,
    lessonDate: {
      [Op.gte]: now,
      [Op.lte]: dateEnd,
    },
  };
};

/**
 * Get count of upcoming lessons for a specific period
 */
export const countUpcomingLessonsForPeriod = async (
  scope: UpcomingLessonScope,
  userId: string | null,
  dateEnd: Date,
): Promise<number> => {
  const periods = getTimePeriods();
  const where = await buildUpcomingLessonWhere(scope, userId, dateEnd, periods);
  const lessons = await Lesson.findAll({ where, raw: true });
  return filterUpcomingLessons(lessons).length;
};

/**
 * Core reusable function to fetch upcoming lessons
 */
export const fetchUpcomingLessons = async (
  scope: UpcomingLessonScope,
  userId: string | null,
  slug: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
): Promise<any[]> => {
  const periods = getTimePeriods();
  const dateEnd = getDateEndFromSlug(slug, periods);
  const where = await buildUpcomingLessonWhere(scope, userId, dateEnd, periods);

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

  return lessons;
};
