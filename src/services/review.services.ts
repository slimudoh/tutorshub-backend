import { Op } from "sequelize";
import { REVIEW, REVIEW_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import Review from "../models/review.models";

export const fetchAdminReviews = async (
  keyword?: string,
  status?: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { currency: { [Op.like]: `%${keyword}%` } },
        { amount: { [Op.like]: `%${keyword}%` } },
        { reference: { [Op.like]: `%${keyword}%` } },
        { channel: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (status) {
    where = {
      ...where,
      status,
    };
  }

  if (!offsetSize && !newPageSize) {
    return await Review.count({ where });
  }

  return await Review.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: REVIEW_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const fetchUserReviews = async (
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
      [Op.or]: [
        { currency: { [Op.like]: `%${keyword}%` } },
        { amount: { [Op.like]: `%${keyword}%` } },
        { reference: { [Op.like]: `%${keyword}%` } },
        { channel: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (status) {
    where = {
      ...where,
      status,
    };
  }

  if (!offsetSize && !newPageSize) {
    return await Review.count({ where });
  }

  return await Review.findAll({
    where: {
      ...where,
      userId,
    },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: REVIEW_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const fetchHomeReviews = async (excludeAttributes = true) => {
  return await Review.findAll({
    where: { isPublic: true, status: REVIEW.ACTIVE },
    order: [["createdAt", "DESC"]],
    limit: 10,
    ...(excludeAttributes && {
      attributes: {
        exclude: REVIEW_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};
