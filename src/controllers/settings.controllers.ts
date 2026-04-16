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
        newCourse: settings?.newCourse || false,
        classNotSubscribed: settings?.classNotSubscribed || false,
        classSubscribed1Day: settings?.classSubscribed1Day || false,
        classSubscribed1Hour: settings?.classSubscribed1Hour || false,
        classSubscribed30Minutes: settings?.classSubscribed30Minutes || false,
        classSubscribed15Minutes: settings?.classSubscribed15Minutes || false,
        classSubscribed5Minutes: settings?.classSubscribed5Minutes || false,
        newMessage: settings?.newMessage || false,
        courseComplete: settings?.courseComplete || false,
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
        newCourse: updatedSettings?.newCourse || false,
        classNotSubscribed: updatedSettings?.classNotSubscribed || false,
        classSubscribed1Day: updatedSettings?.classSubscribed1Day || false,
        classSubscribed1Hour: updatedSettings?.classSubscribed1Hour || false,
        classSubscribed30Minutes:
          updatedSettings?.classSubscribed30Minutes || false,
        classSubscribed15Minutes:
          updatedSettings?.classSubscribed15Minutes || false,
        classSubscribed5Minutes:
          updatedSettings?.classSubscribed5Minutes || false,
        newMessage: updatedSettings?.newMessage || false,
        courseComplete: updatedSettings?.courseComplete || false,
        weeklySummary: updatedSettings?.weeklySummary || false,
        monthlySummary: updatedSettings?.monthlySummary || false,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
