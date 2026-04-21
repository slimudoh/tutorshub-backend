import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class LessonAttendance extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare joinTime: string | null;
  declare leaveTime: string | null;
  declare durationMinutes: string | null;
  declare eligibleForPayout: boolean | null;
  declare payoutAmount: number | null;
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
      type: DataTypes.STRING,
      allowNull: true,
    },
    leaveTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    durationMinutes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eligibleForPayout: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    payoutAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    tableName: "lessonAttendances",
    sequelize,
  },
);

export default LessonAttendance;
