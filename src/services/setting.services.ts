import Setting from "../models/setting.models";
import { findUserByEmail } from "./user.services";

export type NotificationSettingKey =
  | "emailNotification"
  | "pushNotification"
  | "login"
  | "newLesson"
  | "lessonNotSubscribed"
  | "lessonSubscribed1Day"
  | "lessonSubscribed1Hour"
  | "lessonSubscribed30Minutes"
  | "lessonSubscribed15Minutes"
  | "lessonSubscribed5Minutes"
  | "newMessage"
  | "lessonComplete"
  | "weeklySummary"
  | "monthlySummary"
  | "newStudent"
  | "showProfilePublicly"
  | "newReview"
  | "newBooking"
  | "bookingReminder"
  | "bookingCanceled"
  | "bookingCompleted"
  | "bookingRescheduled";

export type NotificationSettingsShape = Record<NotificationSettingKey, boolean>;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsShape = {
  emailNotification: false,
  pushNotification: false,
  login: false,
  newLesson: false,
  lessonNotSubscribed: false,
  lessonSubscribed1Day: false,
  lessonSubscribed1Hour: false,
  lessonSubscribed30Minutes: false,
  lessonSubscribed15Minutes: false,
  lessonSubscribed5Minutes: false,
  newMessage: false,
  lessonComplete: false,
  weeklySummary: false,
  monthlySummary: false,
  newStudent: false,
  showProfilePublicly: false,
  newReview: false,
  newBooking: false,
  bookingReminder: false,
  bookingCanceled: false,
  bookingCompleted: false,
  bookingRescheduled: false,
};

const VALID_KEYS = new Set<string>(Object.keys(DEFAULT_NOTIFICATION_SETTINGS));

const withDefaults = (
  settings: Partial<NotificationSettingsShape> | null | undefined,
): NotificationSettingsShape => {
  const result = { ...DEFAULT_NOTIFICATION_SETTINGS };
  (Object.keys(result) as NotificationSettingKey[]).forEach((key) => {
    result[key] = settings?.[key] ?? false;
  });
  return result;
};

export const buildNotificationSettings = (
  notification: { id: string; value: boolean }[],
): NotificationSettingsShape => {
  const merged = { ...DEFAULT_NOTIFICATION_SETTINGS };

  notification.forEach((item) => {
    if (
      item &&
      typeof item.id === "string" &&
      VALID_KEYS.has(item.id) &&
      typeof item.value === "boolean"
    ) {
      merged[item.id as NotificationSettingKey] = item.value;
    }
  });

  return merged;
};

export const findUserNotificationSettings = async (userId: string) => {
  return Setting.findOne({
    where: { userId },
  });
};

export const getNotificationSettingsByUserId = async (
  userId: string,
): Promise<NotificationSettingsShape> => {
  const settings = await Setting.findOne({
    where: { userId },
  });

  const plain = settings
    ? (settings.toJSON() as Partial<NotificationSettingsShape>)
    : null;

  return withDefaults(plain);
};

export const getNotificationSettingsByUserEmail = async (
  email: string,
): Promise<NotificationSettingsShape | null> => {
  const user = await findUserByEmail(email);

  if (!user?.id) {
    return null;
  }

  return getNotificationSettingsByUserId(user.id);
};

export const upsertNotificationSettingsByUserId = async (
  userId: string,
  notification: { id: string; value: boolean }[],
) => {
  const settings = buildNotificationSettings(notification);

  await Setting.upsert({
    id: crypto.randomUUID(),
    userId,
    ...settings,
  });

  return settings;
};
