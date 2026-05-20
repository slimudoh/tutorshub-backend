import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

// late_join_minutes INT DEFAULT 10

class Lesson extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare categoryId: string | null;
  declare title: string | null;
  declare description: string | null;
  declare level: string | null;
  declare status: string | null;
  declare language: string | null;
  declare duration: string | null;
  declare isLive: boolean | null;
  declare isFree: boolean | null;
  declare creditsRequired: number | null;
  declare lateJoinMinutes: number | null;
  declare maxStudents: number | null;
  declare startTime: Date | null;
  declare joinLink: string | null;
  declare meetingId: string | null;
  declare meetingPassword: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Lesson.init(
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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isLive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isFree: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    creditsRequired: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lateJoinMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10,
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    joinLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meetingId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meetingPassword: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "lesson",
    sequelize,
  },
);

export default Lesson;
