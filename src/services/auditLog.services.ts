import { Op } from "@sequelize/core";
import AuditLog from "../models/auditLog.models";
import crypto from "crypto";

export const createAuditLog = async (payload: {
  user?: string;
  action?: string;
  oldData?: string;
  newData?: string;
  section?: string;
}) => {
  const { user, action, oldData, newData, section } = payload;

  await AuditLog.create({
    id: crypto.randomUUID(),
    user: user ? excludeFields(user) : null,
    action,
    oldData: oldData ? excludeFields(oldData) : null,
    newData: newData ? excludeFields(newData) : null,
    section,
  });
};

export const getAuditLogs = async (
  keyword?: string,
  offsetSize?: number,
  newPageSize?: number,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { user: { [Op.like]: `%${keyword}%` } },
        { action: { [Op.like]: `%${keyword}%` } },
        { oldData: { [Op.like]: `%${keyword}%` } },
        { newData: { [Op.like]: `%${keyword}%` } },
        { section: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (!offsetSize && !newPageSize) {
    return await AuditLog.count({ where });
  }

  return await AuditLog.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    raw: true,
  });
};

export const excludeFields = (data: string) => {
  const parsedData = JSON.parse(data) ?? {};
  const {
    password,
    createdAt,
    updatedAt,
    emailVerified,
    emailVerifiedAt,
    token,
    tokenExpiry,
    tokenExpiryStatus,
    ...rest
  } = parsedData;

  return JSON.stringify(rest);
};
