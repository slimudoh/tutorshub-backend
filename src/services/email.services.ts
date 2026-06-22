import { APP_NAME, APP_URL, MAIL_CONFIG } from "../utils/constant";
import transporter from "../utils/mailer";
import { Options } from "nodemailer/lib/mailer";
import { getAllActiveAdminUsers } from "./user.services";

type ExtendedOptions = Options & {
  template: string;
  context: Record<string, unknown>;
};

type MailPayload = {
  from: string;
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
};

export const sendSingleMail = async (payload: MailPayload) => {
  return dispatchMail(buildMailOptions(payload));
};

export const sendMultipleMails = async ({
  from,
  dataList,
}: {
  from: string;
  dataList: { name: string; email: string }[];
}): Promise<void> => {
  await Promise.all(
    dataList.map((data) =>
      dispatchMail(
        buildMailOptions({
          from,
          to: data.email,
          subject: `You have a notification from ${APP_NAME}`,
          template: "userNotification.views",
          context: notificationContext(data.name),
        }),
      ),
    ),
  );
};

export const sendAdminEmailMessages = async ({
  title,
  subject,
  message,
}: {
  title: string;
  subject: string;
  message: string;
}): Promise<void> => {
  const adminUsers = await getAllActiveAdminUsers();

  await Promise.all(
    adminUsers.map((admin) =>
      dispatchMail(
        buildMailOptions({
          from: MAIL_CONFIG.sender,
          to: admin.emailAddress || "",
          subject,
          template: "adminNotification.views",
          context: { title, message, subject },
        }),
      ),
    ),
  );
};

export const sendUserEmailNotification = async ({
  emailAddress,
  userName,
}: {
  emailAddress: string;
  userName: string;
}): Promise<void> => {
  return sendSingleMail({
    from: MAIL_CONFIG.sender,
    to: emailAddress,
    subject: `You have a notification from ${APP_NAME}`,
    template: "userNotification.views",
    context: notificationContext(userName),
  });
};

export const dispatchMail = (options: ExtendedOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (error: any, info: any) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve();
      }
    });
  });
};

export const buildMailOptions = ({
  from,
  to,
  subject,
  template,
  context,
}: MailPayload): ExtendedOptions => ({
  from,
  to,
  subject,
  template,
  context: {
    ...context,
    appName: APP_NAME,
    year: new Date().getFullYear(),
  },
});

export const notificationContext = (userName: string) => ({
  title: `You have a notification from ${APP_NAME}`,
  userName,
  message: `You have received a new notification from ${APP_NAME}. Please login to your account to view the notification.`,
  link: `${APP_URL}/user/notifications`,
});
