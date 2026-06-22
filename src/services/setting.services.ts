// import Setting from "../models/setting.models";
// import { findUserByEmail } from "./user.services";

// export const findUserNotificationSettings = async (userId: string) => {
//   const settings = await Setting.findOne({
//     where: {
//       userId,
//     },
//   });

//   return settings;
// };

// export const getNotificationSettingsByUserId = async (userId: string) => {
//   const settings = await Setting.findOne({
//     where: {
//       userId,
//     },
//   });

//   return {
//     emailNotification: settings?.emailNotification || false,
//     pushNotification: settings?.pushNotification || false,
//     login: settings?.login || false,
//     newLesson: settings?.newLesson || false,
//     lessonNotSubscribed: settings?.lessonNotSubscribed || false,
//     lessonSubscribed1Day: settings?.lessonSubscribed1Day || false,
//     lessonSubscribed1Hour: settings?.lessonSubscribed1Hour || false,
//     lessonSubscribed30Minutes: settings?.lessonSubscribed30Minutes || false,
//     lessonSubscribed15Minutes: settings?.lessonSubscribed15Minutes || false,
//     lessonSubscribed5Minutes: settings?.lessonSubscribed5Minutes || false,
//     newMessage: settings?.newMessage || false,
//     lessonComplete: settings?.lessonComplete || false,
//     weeklySummary: settings?.weeklySummary || false,
//     monthlySummary: settings?.monthlySummary || false,
//     newStudent: settings?.newStudent || false,
//     showProfilePublicly: settings?.showProfilePublicly || false,
//     newReview: settings?.newReview || false,
//     newBooking: settings?.newBooking || false,
//     bookingReminder: settings?.bookingReminder || false,
//     bookingCanceled: settings?.bookingCanceled || false,
//     bookingCompleted: settings?.bookingCompleted || false,
//     bookingRescheduled: settings?.bookingRescheduled || false,
//   };
// };

// export const getNotificationSettingsByUserEmail = async (email: string) => {
//   const user = await findUserByEmail(email);

//   if (!user?.id) {
//     return null;
//   }

//   const settings = await Setting.findOne({
//     where: {
//       userId: user.id,
//     },
//   });

//   return {
//     emailNotification: settings?.emailNotification || false,
//     pushNotification: settings?.pushNotification || false,
//     login: settings?.login || false,
//     newLesson: settings?.newLesson || false,
//     lessonNotSubscribed: settings?.lessonNotSubscribed || false,
//     lessonSubscribed1Day: settings?.lessonSubscribed1Day || false,
//     lessonSubscribed1Hour: settings?.lessonSubscribed1Hour || false,
//     lessonSubscribed30Minutes: settings?.lessonSubscribed30Minutes || false,
//     lessonSubscribed15Minutes: settings?.lessonSubscribed15Minutes || false,
//     lessonSubscribed5Minutes: settings?.lessonSubscribed5Minutes || false,
//     newMessage: settings?.newMessage || false,
//     lessonComplete: settings?.lessonComplete || false,
//     weeklySummary: settings?.weeklySummary || false,
//     monthlySummary: settings?.monthlySummary || false,
//     newStudent: settings?.newStudent || false,
//     showProfilePublicly: settings?.showProfilePublicly || false,
//     newReview: settings?.newReview || false,
//     newBooking: settings?.newBooking || false,
//     bookingReminder: settings?.bookingReminder || false,
//     bookingCanceled: settings?.bookingCanceled || false,
//     bookingCompleted: settings?.bookingCompleted || false,
//     bookingRescheduled: settings?.bookingRescheduled || false,
//   };
// };

// export const createNotificationSettingsByUserId = async (
//   userId: string,
//   notification: {
//     id: string;
//     value: boolean;
//   }[],
// ) => {
//   const newSettings = {
//     emailNotification: false,
//     pushNotification: false,
//     login: false,
//     newLesson: false,
//     lessonNotSubscribed: false,
//     lessonSubscribed1Day: false,
//     lessonSubscribed1Hour: false,
//     lessonSubscribed30Minutes: false,
//     lessonSubscribed15Minutes: false,
//     lessonSubscribed5Minutes: false,
//     newMessage: false,
//     lessonComplete: false,
//     weeklySummary: false,
//     monthlySummary: false,
//     newStudent: false,
//     showProfilePublicly: false,
//     newReview: false,
//     newBooking: false,
//     bookingReminder: false,
//     bookingCanceled: false,
//     bookingCompleted: false,
//     bookingRescheduled: false,
//   };

//   notification.forEach((item: { id: string; value: boolean }) => {
//     newSettings[item.id as keyof typeof newSettings] = item.value;
//   });

//   await Setting.create({
//     id: crypto.randomUUID(),
//     userId,
//     ...newSettings,
//   });
// };

// export const updateNotificationSettingsByUserId = async (
//   userId: string,
//   notification: {
//     id: string;
//     value: boolean;
//   }[],
// ) => {
//   const newSettings = {
//     emailNotification: false,
//     pushNotification: false,
//     login: false,
//     newLesson: false,
//     lessonNotSubscribed: false,
//     lessonSubscribed1Day: false,
//     lessonSubscribed1Hour: false,
//     lessonSubscribed30Minutes: false,
//     lessonSubscribed15Minutes: false,
//     lessonSubscribed5Minutes: false,
//     newMessage: false,
//     lessonComplete: false,
//     weeklySummary: false,
//     monthlySummary: false,
//     newStudent: false,
//     showProfilePublicly: false,
//     newReview: false,
//     newBooking: false,
//     bookingReminder: false,
//     bookingCanceled: false,
//     bookingCompleted: false,
//     bookingRescheduled: false,
//   };

//   notification.forEach((item: { id: string; value: boolean }) => {
//     newSettings[item.id as keyof typeof newSettings] = item.value;
//   });

//   await Setting.update(newSettings, {
//     where: {
//       userId,
//     },
//   });
// };
