import { Op } from "sequelize";
import { ENROLLEE_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import LessonEnrollment from "../models/lessonEnrollment.models";
import User from "../models/user.models";
import LessonAttendance from "../models/lessonAttendance.models";

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
