import transporter from "../utils/mailer";
import { Options } from "nodemailer/lib/mailer";

type ExtendedOptions = Options & {
  template: string;
  context: Record<string, unknown>;
};

// settings.newCourse = notification.newCourse;
// settings.classNotSubscribed = notification.classNotSubscribed;
// settings.classSubscribed1Day = notification.classSubscribed1Day;
// settings.classSubscribed1Hour = notification.classSubscribed1Hour;
// settings.classSubscribed30Minutes = notification.classSubscribed30Minutes;
// settings.classSubscribed15Minutes = notification.classSubscribed15Minutes;
// settings.classSubscribed5Minutes = notification.classSubscribed5Minutes;
// settings.newMessage = notification.newMessage;
// settings.courseComplete = notification.courseComplete;
// settings.weeklySummary = notification.weeklySummary;
// settings.monthlySummary = notification.monthlySummary;

export const sendMail = (options: ExtendedOptions) => {
  return transporter.sendMail(options, (error: any, info: any) => {
    if (error) {
      console.error("Error sending email: ", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
