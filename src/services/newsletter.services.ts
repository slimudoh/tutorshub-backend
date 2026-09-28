import { Op } from "@sequelize/core";
import Newsletter from "../models/newsletter.models";
import { buildNewsletterSearchWhere } from "../utils/search";

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
  const where = buildNewsletterSearchWhere(keyword, ["email"]);

  if (!offsetSize && !newPageSize) {
    return await Newsletter.count({ where });
  }

  return await Newsletter.findAll({
    where,

    order: [["updatedAt", "DESC"]],
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
