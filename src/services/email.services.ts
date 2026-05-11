import { APP_NAME } from "../utils/constant";
import transporter from "../utils/mailer";
import { Options } from "nodemailer/lib/mailer";
import { getNotificationSettingsByUserEmail } from "./setting.services";

type ExtendedOptions = Options & {
  template: string;
  context: Record<string, unknown>;
};

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

export const sendSingleMail = async ({
  from,
  to,
  context,
  subject,
  template,
}: {
  from: string;
  to: string;
  context: Record<string, unknown>;
  subject: string;
  template: string;
}) => {
  const options: ExtendedOptions = {
    from,
    to,
    subject,
    template,
    context: {
      ...context,
      appName: APP_NAME,
      year: new Date().getFullYear(),
    },
  };

  const userSetting = await getNotificationSettingsByUserEmail(to);

  if (!userSetting?.emailNotification) {
    return;
  }

  return transporter.sendMail(options, (error: any, info: any) => {
    if (error) {
      console.error("Error sending email: ", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

export const sendMultipleMails = async ({
  from,
  dataList,
  context,
  subject,
  template,
}: {
  from: string;
  dataList: { name: string; email: string }[];
  context: Record<string, unknown>;
  subject: string;
  template: string;
}) => {
  const emailPromises = dataList.map(async (data) => {
    const userSetting = await getNotificationSettingsByUserEmail(data.email);

    if (!userSetting?.emailNotification) {
      return;
    }

    const options: ExtendedOptions = {
      from,
      to: data.email,
      subject,
      template,
      context: {
        ...context,
        appName: APP_NAME,
        year: new Date().getFullYear(),
      },
    };
    return transporter.sendMail(options);
  });
  await Promise.all(emailPromises);
};
