import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";
import Lesson from "./lesson.models";
import User from "./user.models";

class LessonEnrollment extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare creditsUsed: number | null;
  declare status: string | null;
  declare lesson: Lesson | null;
  declare user: User | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

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
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "lessonEnrollments",
    sequelize,
  },
);

export default LessonEnrollment;
