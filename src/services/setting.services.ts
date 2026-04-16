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
    newCourse: false,
    classNotSubscribed: false,
    classSubscribed1Day: false,
    classSubscribed1Hour: false,
    classSubscribed30Minutes: false,
    classSubscribed15Minutes: false,
    classSubscribed5Minutes: false,
    newMessage: false,
    courseComplete: false,
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
    newCourse: false,
    classNotSubscribed: false,
    classSubscribed1Day: false,
    classSubscribed1Hour: false,
    classSubscribed30Minutes: false,
    classSubscribed15Minutes: false,
    classSubscribed5Minutes: false,
    newMessage: false,
    courseComplete: false,
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
