"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const mailer_1 = __importDefault(require("../utils/mailer"));
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
const sendMail = (options) => {
    return mailer_1.default.sendMail(options, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        }
        else {
            console.log("Email sent: " + info.response);
        }
    });
};
exports.sendMail = sendMail;
