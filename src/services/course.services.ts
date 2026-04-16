import { Op } from "sequelize";
import Course from "../models/course.models";
import { COURSE_EXCLUDED_ATTRIBUTES, STATUS } from "../utils/constant";
import CourseHistory from "../models/courseHistory.models";

export const findCourseById = async (id: string, excludeAttributes = true) => {
  return await Course.findOne({
    where: {
      id: id,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: COURSE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getAdminCourses = async (
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
    return await Course.count({ where: { ...where } });
  }

  return await Course.findAll({
    where: { ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: COURSE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getUserCourses = async (
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
    return await Course.count({ where: { userId, ...where } });
  }

  return await Course.findAll({
    where: { userId, ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: COURSE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getActiveCourses = async (
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
    return await Course.count({ where: { status: STATUS.ACTIVE, ...where } });
  }

  return await Course.findAll({
    where: { status: STATUS.ACTIVE, ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: COURSE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const updateCourseStatus = async (id: string, status: string) => {
  await Course.update({ status }, { where: { id } });
};

export const getCourseHistories = async (
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
    return await CourseHistory.count({ where: { userId, ...where } });
  }

  return await CourseHistory.findAll({
    where: {
      userId,
      ...where,
    },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: COURSE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getLiveCourses = async () => {
  return await Course.findAll({
    where: { isLive: true },
    raw: true,
  });
};

export const findAllCoursesByIds = async (ids: string[]) => {
  return await Course.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    raw: true,
  });
};
