import { NOTIFICATION_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import Notification from "../models/notification.models";
import { Op } from "@sequelize/core";
import { getAllActiveAdminUsers } from "./user.services";

export const findNotificationById = async (
  id: string,
  excludeAttributes = true,
) => {
  return await Notification.findOne({
    where: {
      id,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: NOTIFICATION_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getUserNotifications = async (
  userId: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  if (!offsetSize && !newPageSize) {
    return await Notification.count({
      where: { receiverId: userId, isDeleted: false },
    });
  }

  return await Notification.findAll({
    where: {
      receiverId: userId,
      isDeleted: false,
    },
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: NOTIFICATION_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const createNotification = async (
  title: string,
  message: string,
  receiverId: string,
  senderId: string | null = null,
) => {
  return await Notification.create({
    id: crypto.randomUUID(),
    senderId,
    receiverId,
    title,
    message,
    isDelivered: true,
    deliveredAt: new Date(),
  });
};

export const createBulkNotifications = async (
  payload: {
    title: string;
    message: string;
    receiverId: string;
    senderId: string | null;
  }[],
) => {
  return await Notification.bulkCreate(
    payload.map((item) => ({
      id: crypto.randomUUID(),
      senderId: item.senderId,
      receiverId: item.receiverId,
      title: item.title,
      message: item.message,
      isDelivered: true,
      deliveredAt: new Date(),
    })),
  );
};

export const createAdminNotifications = async (payload: {
  title: string;
  message: string;
  senderId: string | null;
}) => {
  const adminUsers = await getAllActiveAdminUsers();

  return await Notification.bulkCreate(
    adminUsers.map((admin) => ({
      id: crypto.randomUUID(),
      senderId: payload.senderId,
      receiverId: admin.id,
      title: payload.title,
      message: payload.message,
      isDelivered: true,
      deliveredAt: new Date(),
    })),
  );
};

export const readAllUserNotifications = async (
  userId: string,
  offset: number,
  limit: number,
) => {
  const notifications = await Notification.findAll({
    where: { receiverId: userId, isRead: false },
    attributes: ["id"],
    offset,
    limit,
    raw: true,
  });

  if (!notifications.length) return;

  return await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { id: { [Op.in]: notifications.map((n) => n.id) } } },
  );
};
