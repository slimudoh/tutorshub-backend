import { Op } from "sequelize";
import Enrollee from "../models/enrollee.models";
import { ENROLLEE_EXCLUDED_ATTRIBUTES } from "../utils/constant";

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
    return await Enrollee.count({ where: { ...where } });
  }

  return await Enrollee.findAll({
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
    return await Enrollee.count({ where: { ...where, userId } });
  }

  return await Enrollee.findAll({
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
