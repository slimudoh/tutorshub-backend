import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Setting extends Model {
  declare id: string | null;
  declare userId: string | null;
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
      allowNull: false,
    },
    login: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    newLesson: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lessonNotSubscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lessonSubscribed1Day: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lessonSubscribed1Hour: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lessonSubscribed30Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lessonSubscribed15Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lessonSubscribed5Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    newMessage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lessonComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    weeklySummary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    monthlySummary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "settings",
    sequelize,
  },
);

export default Setting;
