import transporter from "../utils/mailer";
import { Options } from "nodemailer/lib/mailer";

type ExtendedOptions = Options & {
  template: string;
  context: Record<string, unknown>;
};

// settings.newLesson = notification.newLesson;
// settings.lessonNotSubscribed = notification.lessonNotSubscribed;
// settings.lessonSubscribed1Day = notification.lessonSubscribed1Day;
// settings.lessonSubscribed1Hour = notification.lessonSubscribed1Hour;
// settings.lessonSubscribed30Minutes = notification.lessonSubscribed30Minutes;
// settings.lessonSubscribed15Minutes = notification.lessonSubscribed15Minutes;
// settings.lessonSubscribed5Minutes = notification.lessonSubscribed5Minutes;
// settings.newMessage = notification.newMessage;
// settings.lessonComplete = notification.lessonComplete;
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
