import { Op } from "sequelize";
import { NOTIFICATION_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import Notification from "../models/notification.models";
import { format } from "date-fns";

// settings.newLesson = notification.newLesson;
// settings.lessonNotSubscribed = notification.lessonNotSubscribed;
// settings.lessonSubscribed1Day = notification.lessonSubscribed1Day;
// settings.lessonSubscribed1Hour = notification.lessonSubscribed1Hour;
// settings.lessonSubscribed30Minutes = notification.lessonSubscribed30Minutes;
// settings.lessonSubscribed15Minutes = notification.lessonSubscribed15Minutes;
// settings.lessonSubscribed5Minutes = notification.lessonSubscribed5Minutes;
// settings.newNotification = notification.newNotification;
// settings.lessonComplete = notification.lessonComplete;
// settings.weeklySummary = notification.weeklySummary;
// settings.monthlySummary = notification.monthlySummary;

export const findNotificationById = async (
  id: string,
  excludeAttributes = true,
) => {
  return await Notification.findOne({
    where: {
      id: id,
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
      isRead: status === "READ",
    };
  }

  if (!offsetSize && !newPageSize) {
    return await Notification.count({
      where: { receiverId: userId, isDeleted: false, ...where },
    });
  }

  return await Notification.findAll({
    where: {
      receiverId: userId,
      isDeleted: false,
      ...where,
    },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
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

export const markUserNotificationAsRead = async (id: string) => {
  return await Notification.update(
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      where: {
        id: id,
        isRead: false,
      },
    },
  );
};

export const deleteUserNotification = async (id: string) => {
  return await Notification.update(
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      where: {
        id: id,
      },
    },
  );
};
