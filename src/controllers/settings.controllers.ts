import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  createNotificationSettingsByUserId,
  getNotificationSettingsByUserId,
  updateNotificationSettingsByUserId,
} from "../services/setting.services";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById } from "../services/user.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getUserSettings: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const settings = await getNotificationSettingsByUserId(userId);

    response.status(201).json({
      data: {
        login: settings?.login || false,
        newLesson: settings?.newLesson || false,
        lessonNotSubscribed: settings?.lessonNotSubscribed || false,
        lessonSubscribed1Day: settings?.lessonSubscribed1Day || false,
        lessonSubscribed1Hour: settings?.lessonSubscribed1Hour || false,
        lessonSubscribed30Minutes: settings?.lessonSubscribed30Minutes || false,
        lessonSubscribed15Minutes: settings?.lessonSubscribed15Minutes || false,
        lessonSubscribed5Minutes: settings?.lessonSubscribed5Minutes || false,
        newMessage: settings?.newMessage || false,
        lessonComplete: settings?.lessonComplete || false,
        weeklySummary: settings?.weeklySummary || false,
        monthlySummary: settings?.monthlySummary || false,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const updateNotificationSettings: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { notification } = request.body;

    const settings = await getNotificationSettingsByUserId(userId);
    const targetUser = await findUserById(userId);
    let updatedSettings;

    if (settings) {
      await updateNotificationSettingsByUserId(userId, notification);
      updatedSettings = await getNotificationSettingsByUserId(userId);
      await createAuditLog({
        user: JSON.stringify(targetUser),
        action: "UPDATE NOTIFICATION SETTINGS",
        oldData: JSON.stringify(settings),
        newData: JSON.stringify(updatedSettings),
        section: "NOTIFICATION SETTINGS",
      });
    } else {
      await createNotificationSettingsByUserId(userId, notification);
      updatedSettings = await getNotificationSettingsByUserId(userId);
      await createAuditLog({
        user: JSON.stringify(targetUser),
        action: "CREATE NOTIFICATION SETTINGS",
        newData: JSON.stringify(updatedSettings),
        section: "NOTIFICATION SETTINGS",
      });
    }

    response.status(201).json({
      message: "Notification settings updated successfully",
      data: {
        login: updatedSettings?.login || false,
        newLesson: updatedSettings?.newLesson || false,
        lessonNotSubscribed: updatedSettings?.lessonNotSubscribed || false,
        lessonSubscribed1Day: updatedSettings?.lessonSubscribed1Day || false,
        lessonSubscribed1Hour: updatedSettings?.lessonSubscribed1Hour || false,
        lessonSubscribed30Minutes:
          updatedSettings?.lessonSubscribed30Minutes || false,
        lessonSubscribed15Minutes:
          updatedSettings?.lessonSubscribed15Minutes || false,
        lessonSubscribed5Minutes:
          updatedSettings?.lessonSubscribed5Minutes || false,
        newMessage: updatedSettings?.newMessage || false,
        lessonComplete: updatedSettings?.lessonComplete || false,
        weeklySummary: updatedSettings?.weeklySummary || false,
        monthlySummary: updatedSettings?.monthlySummary || false,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
