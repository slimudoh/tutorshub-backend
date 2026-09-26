import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import {
  findUserNotificationSettings,
  getNotificationSettingsByUserId,
  upsertNotificationSettingsByUserId,
} from "../services/setting.services";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById } from "../services/user.services";
import { CustomRequest } from "../types";

const isValidNotificationPayload = (
  body: unknown,
): body is { notification: { id: string; value: boolean }[] } => {
  return (
    !!body &&
    typeof body === "object" &&
    Array.isArray((body as any).notification) &&
    (body as any).notification.every(
      (item: any) =>
        item && typeof item.id === "string" && typeof item.value === "boolean",
    )
  );
};

export const getUserSettings: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const settings = await getNotificationSettingsByUserId(userId);

    response.status(200).json({
      data: settings,
    });
  } catch (err) {
    next(createServerError(err as Error, 500));
  }
};

export const updateNotificationSettings: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    if (!isValidNotificationPayload(request.body)) {
      return next(
        createServerError(
          new Error("`notification` must be an array of { id, value }"),
          400,
        ),
      );
    }

    const { notification } = request.body;

    const existing = await findUserNotificationSettings(userId);
    const targetUser = await findUserById(userId);
    const wasExisting = !!existing;

    const updatedSettings = await upsertNotificationSettingsByUserId(
      userId,
      notification,
    );

    await createAuditLog({
      user: targetUser
        ? JSON.stringify({ id: targetUser.id, email: targetUser.emailAddress })
        : JSON.stringify({ id: userId }),
      action: wasExisting
        ? "UPDATE NOTIFICATION SETTINGS"
        : "CREATE NOTIFICATION SETTINGS",
      ...(wasExisting ? { oldData: JSON.stringify(existing) } : {}),
      newData: JSON.stringify(updatedSettings),
      section: "SETTINGS",
    });

    response.status(200).json({
      message: "Notification settings updated successfully",
      data: updatedSettings,
    });
  } catch (err) {
    next(createServerError(err as Error, 500));
  }
};
