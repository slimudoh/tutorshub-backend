import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  createNotificationSettingsByUserId,
  findUserNotificationSettings,
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
      data: settings,
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

    const settings = await findUserNotificationSettings(userId);
    const targetUser = await findUserById(userId);
    let updatedSettings;

    console.log({ settings });

    if (settings) {
      await updateNotificationSettingsByUserId(userId, notification);
      updatedSettings = await getNotificationSettingsByUserId(userId);
      await createAuditLog({
        user: JSON.stringify(targetUser),
        action: "UPDATE NOTIFICATION SETTINGS",
        oldData: JSON.stringify(settings),
        newData: JSON.stringify(updatedSettings),
        section: "SETTINGS",
      });
    } else {
      await createNotificationSettingsByUserId(userId, notification);
      updatedSettings = await getNotificationSettingsByUserId(userId);
      await createAuditLog({
        user: JSON.stringify(targetUser),
        action: "CREATE NOTIFICATION SETTINGS",
        newData: JSON.stringify(updatedSettings),
        section: "SETTINGS",
      });
    }

    response.status(201).json({
      message: "Notification settings updated successfully",
      data: updatedSettings,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
