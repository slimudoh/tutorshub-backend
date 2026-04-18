import Setting from "../models/setting.models";

export const getNotificationSettingsByUserId = async (userId: string) => {
  const settings = await Setting.findOne({
    where: {
      userId,
    },
  });

  return settings;
};

export const createNotificationSettingsByUserId = async (
  userId: string,
  notification: {
    id: string;
    value: boolean;
  }[],
) => {
  const newSettings = {
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
  };

  notification.forEach((item: { id: string; value: boolean }) => {
    newSettings[item.id as keyof typeof newSettings] = item.value;
  });

  await Setting.create({
    id: crypto.randomUUID(),
    userId,
    ...newSettings,
  });
};

export const updateNotificationSettingsByUserId = async (
  userId: string,
  notification: {
    id: string;
    value: boolean;
  }[],
) => {
  const newSettings = {
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
  };

  notification.forEach((item: { id: string; value: boolean }) => {
    newSettings[item.id as keyof typeof newSettings] = item.value;
  });

  await Setting.update(newSettings, {
    where: {
      userId,
    },
  });
};
