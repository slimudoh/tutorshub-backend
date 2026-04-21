import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class LessonEnrollment extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare credits_used: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

// id
// user_id
// lesson_id
// status (active, cancelled, attended)
// credit_used

LessonEnrollment.init(
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
    creditsUsed: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "lessonEnrollments",
    sequelize,
  },
);

export default LessonEnrollment;
