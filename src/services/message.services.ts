import { Op } from "sequelize";
import { MESSAGE_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import Message from "../models/message.models";
import { format } from "date-fns";

// settings.newCourse = notification.newCourse;
// settings.classNotSubscribed = notification.classNotSubscribed;
// settings.classSubscribed1Day = notification.classSubscribed1Day;
// settings.classSubscribed1Hour = notification.classSubscribed1Hour;
// settings.classSubscribed30Minutes = notification.classSubscribed30Minutes;
// settings.classSubscribed15Minutes = notification.classSubscribed15Minutes;
// settings.classSubscribed5Minutes = notification.classSubscribed5Minutes;
// settings.newMessage = notification.newMessage;
// settings.courseComplete = notification.courseComplete;
// settings.weeklySummary = notification.weeklySummary;
// settings.monthlySummary = notification.monthlySummary;

export const findMessageById = async (id: string, excludeAttributes = true) => {
  return await Message.findOne({
    where: {
      id: id,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: MESSAGE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getUserMessages = async (
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
    return await Message.count({
      where: { receiverId: userId, isDeleted: false, ...where },
    });
  }

  return await Message.findAll({
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
        exclude: MESSAGE_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const createMessage = async (
  title: string,
  message: string,
  receiverId: string,
  senderId: string | null = null,
) => {
  return await Message.create({
    id: crypto.randomUUID(),
    senderId,
    receiverId,
    title,
    message,
    isDelivered: true,
    deliveredAt: new Date(),
  });
};

export const markUserMessageAsRead = async (id: string) => {
  return await Message.update(
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

export const deleteUserMessage = async (id: string) => {
  return await Message.update(
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
