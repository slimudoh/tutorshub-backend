import { Op } from "@sequelize/core";
import Newsletter from "../models/newsletter.models";

export const findNewsletterByEmail = async (email: string) => {
  return await Newsletter.findOne({
    where: {
      email,
    },
  });
};

export const findNewsletterById = async (id: string) => {
  return await Newsletter.findOne({
    where: {
      id,
    },
  });
};

export const createNewsletter = async (email: string) => {
  const newsletter = await Newsletter.create({
    id: crypto.randomUUID(),
    email,
  });

  return newsletter;
};

export const getAllSubscribers = async (
  keyword: string,
  offsetSize?: number,
  newPageSize?: number,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [{ email: { [Op.like]: `%${keyword}%` } }],
    };
  }

  if (!offsetSize && !newPageSize) {
    return await Newsletter.count({ where });
  }

  return await Newsletter.findAll({
    where,

    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    raw: true,
  });
};

export const removeSubscriber = async (id: string) => {
  return await Newsletter.destroy({
    where: {
      id,
    },
  });
};
