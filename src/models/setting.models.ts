import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Setting extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare emailNotification: boolean | null;
  declare pushNotification: boolean | null;
  declare login: boolean | null;
  declare newLesson: boolean | null;
  declare lessonNotSubscribed: boolean | null;
  declare lessonSubscribed1Day: boolean | null;
  declare lessonSubscribed1Hour: boolean | null;
  declare lessonSubscribed30Minutes: boolean | null;
  declare lessonSubscribed15Minutes: boolean | null;
  declare lessonSubscribed5Minutes: boolean | null;
  declare newMessage: boolean | null;
  declare lessonComplete: boolean | null;
  declare weeklySummary: boolean | null;
  declare monthlySummary: boolean | null;
  declare newStudent: boolean | null;
  declare showProfilePublicly: boolean | null;
  declare newReview: boolean | null;
  declare newBooking: boolean | null;
  declare bookingReminder: boolean | null;
  declare bookingCanceled: boolean | null;
  declare bookingCompleted: boolean | null;
  declare bookingRescheduled: boolean | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Setting.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    emailNotification: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    pushNotification: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    login: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    newLesson: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    lessonNotSubscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    lessonSubscribed1Day: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    lessonSubscribed1Hour: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    lessonSubscribed30Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    lessonSubscribed15Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    lessonSubscribed5Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    newMessage: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    lessonComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    weeklySummary: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    monthlySummary: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    newStudent: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    showProfilePublicly: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    newReview: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    newBooking: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    bookingReminder: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    bookingCanceled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    bookingCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    bookingRescheduled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    tableName: "settings",
    sequelize,
  },
);

export default Setting;
