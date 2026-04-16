import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Setting extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare login: boolean | null;
  declare newCourse: boolean | null;
  declare classNotSubscribed: boolean | null;
  declare classSubscribed1Day: boolean | null;
  declare classSubscribed1Hour: boolean | null;
  declare classSubscribed30Minutes: boolean | null;
  declare classSubscribed15Minutes: boolean | null;
  declare classSubscribed5Minutes: boolean | null;
  declare newMessage: boolean | null;
  declare courseComplete: boolean | null;
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
    newCourse: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    classNotSubscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    classSubscribed1Day: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    classSubscribed1Hour: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    classSubscribed30Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    classSubscribed15Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    classSubscribed5Minutes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    newMessage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    courseComplete: {
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
