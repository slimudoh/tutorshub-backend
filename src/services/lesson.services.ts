import { Op } from "sequelize";
import Lesson from "../models/lesson.models";
import { LESSON_EXCLUDED_ATTRIBUTES, STATUS } from "../utils/constant";
import LessonHistory from "../models/lessonHistory.models";

export const findLessonById = async (id: string, excludeAttributes = true) => {
  return await Lesson.findOne({
    where: {
      id: id,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: LESSON_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
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

  return await Lesson.findAll({
    where: { ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: LESSON_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
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
    return await Lesson.count({ where: { userId, ...where } });
  }

  return await Lesson.findAll({
    where: { userId, ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: LESSON_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getActiveLessons = async (
  keyword?: string,
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

  if (!offsetSize && !newPageSize) {
    return await Lesson.count({ where: { status: STATUS.ACTIVE, ...where } });
  }

  return await Lesson.findAll({
    where: { status: STATUS.ACTIVE, ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: LESSON_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const updateLessonStatus = async (id: string, status: string) => {
  await Lesson.update({ status }, { where: { id } });
};

export const getLessonHistories = async (
  userId: string,
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
    return await LessonHistory.count({ where: { userId, ...where } });
  }

  return await LessonHistory.findAll({
    where: {
      userId,
      ...where,
    },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: LESSON_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getLiveLessons = async () => {
  return await Lesson.findAll({
    where: { isLive: true },
    raw: true,
  });
};

export const findAllLessonsByIds = async (ids: string[]) => {
  return await Lesson.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    raw: true,
  });
};
