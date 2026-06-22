import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class LessonAttendance extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare joinTime: Date | null;
  declare leaveTime: Date | null;
  declare durationMinutes: number | null;
  declare eligibleForPayout: boolean | null;
  declare currency: string | null;
  declare payoutAmount: number | null;
  declare platformAmount: number | null;
  declare joinLink: string | null;
  declare isHost: boolean | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

LessonAttendance.init(
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
    lessonId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    joinTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    leaveTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    eligibleForPayout: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payoutAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    platFormAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    joinLink: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isHost: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "lessonAttendances",
    sequelize,
  },
);

export default LessonAttendance;
