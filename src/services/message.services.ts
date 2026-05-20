import { Op } from "@sequelize/core";
import Message from "../models/message.models";
import { MESSAGE, MESSAGE_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import crypto from "crypto";

export const addMessage = async (
  name: string,
  email: string,
  subject: string,
  message: string,
  userId?: string,
) => {
  return await Message.create({
    id: crypto.randomUUID(),
    name,
    email,
    subject,
    message,
    userId: userId || null,
    status: MESSAGE.NEW,
  });
};

export const getMessages = async (
  keyword: string,
  status: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { name: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { subject: { [Op.like]: `%${keyword}%` } },
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
    return await Message.count({ where });
  }

  return await Message.findAll({
    where,

    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: MESSAGE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getMessageById = async (id: string) => {
  return await Message.findOne({
    where: { id },
    attributes: {
      exclude: MESSAGE_EXCLUDED_ATTRIBUTES,
    },
    raw: true,
  });
};

export const updateMessageStatus = async (id: string, status: string) => {
  await Message.update({ status }, { where: { id } });
};
