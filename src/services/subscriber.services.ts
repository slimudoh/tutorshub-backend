import { Op } from "sequelize";
import Subscriber from "../models/subscriber.models";
import { SUBSCRIBER_EXCLUDED_ATTRIBUTES } from "../utils/constant";

export const getAdminSubscribers = async (
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
    return await Subscriber.count({ where: { ...where } });
  }

  return await Subscriber.findAll({
    where: { ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: SUBSCRIBER_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getSubscribers = async (
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
    return await Subscriber.count({ where: { ...where, userId } });
  }

  return await Subscriber.findAll({
    where: { ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: SUBSCRIBER_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};
