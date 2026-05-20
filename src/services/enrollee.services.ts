import { Op } from "sequelize";
import { ENROLLEE_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import LessonEnrollment from "../models/lessonEnrollment.models";

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
    return await LessonEnrollment.count({ where: { ...where } });
  }

  return await LessonEnrollment.findAll({
    where: { ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: ENROLLEE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getEnrollees = async (
  userId: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (!offsetSize && !newPageSize) {
    return await LessonEnrollment.count({ where: { ...where, userId } });
  }

  return await LessonEnrollment.findAll({
    where: { ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: ENROLLEE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};
