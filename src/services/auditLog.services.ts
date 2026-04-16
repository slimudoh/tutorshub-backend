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
  console.log({ user });

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
  offsetSize?: number,
  newPageSize?: number,
) => {
  const auditLogs = await AuditLog.findAll({
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    order: [["createdAt", "DESC"]],
    raw: true,
  });

  if (!offsetSize && !newPageSize) {
    return await AuditLog.count();
  }

  return auditLogs;
};

export const excludeFields = (data: string) => {
  const parsedData = JSON.parse(data);
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
