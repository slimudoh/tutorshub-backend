import { NOTIFICATION_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import Notification from "../models/notification.models";
import { getNotificationSettingsByUserId } from "./setting.services";

//   newClass: boolean;
//   classNotSubscribed: boolean;
//   classSubscribed1Day: boolean;
//   classSubscribed1Hour: boolean;
//   classSubscribed30Minutes: boolean;
//   classSubscribed15Minutes: boolean;
//   classSubscribed5Minutes: boolean;
//   classComplete: boolean;
//   weeklySummary: boolean;
//   monthlySummary: boolean;
//   newReview: boolean;
//   newBooking: boolean;
//   bookingReminder: boolean;
//   bookingCanceled: boolean;
//   bookingCompleted: boolean;
//   bookingRescheduled: boolean;

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
  const userSetting = await getNotificationSettingsByUserId(receiverId);

  if (!userSetting?.pushNotification) {
    return;
  }

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

export const readAllUserNotifications = async (
  userId: string,
  offsetSize: number,
  newPageSize: number,
) => {
  return await Notification.update(
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      where: {
        receiverId: userId,
        isRead: false,
      },
      ...(offsetSize && { offset: offsetSize }),
      ...(newPageSize && { limit: newPageSize }),
    },
  );
};
