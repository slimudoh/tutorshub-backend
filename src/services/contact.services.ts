import { Op } from "@sequelize/core";
import ContactMessage from "../models/ContactMessage.models";
import { CONTACT, CONTACT_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import crypto from "crypto";

export const addContactMessage = async (
  name: string,
  email: string,
  subject: string,
  message: string,
  userId?: string,
) => {
  return await ContactMessage.create({
    id: crypto.randomUUID(),
    name,
    email,
    subject,
    message,
    userId: userId || null,
    status: CONTACT.NEW,
  });
};

export const getContactMessages = async (
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
    return await ContactMessage.count({ where });
  }

  return await ContactMessage.findAll({
    where,

    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: CONTACT_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getContactMessageById = async (id: string) => {
  return await ContactMessage.findOne({
    where: { id },
    attributes: {
      exclude: CONTACT_EXCLUDED_ATTRIBUTES,
    },
    raw: true,
  });
};

export const updateContactMessageStatus = async (
  id: string,
  status: string,
) => {
  await ContactMessage.update({ status }, { where: { id } });
};
