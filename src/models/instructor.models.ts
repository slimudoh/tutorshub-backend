import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";
import User from "./user.models";
import Lesson from "./lesson.models";
import Review from "./review.models";

class Instructor extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare firstName: string | null;
  declare lastName: string | null;
  declare bio: string | null;
  declare profession: string | null;
  declare experience: string | null;
  declare languages: string[] | null;
  declare skills: string[] | null;
  declare socialLinks: string[] | null;
  declare status: string | null;
  declare user: User | null;
  declare totalStudents: number | null;
  declare totalLessons: number | null;
  declare lessons: Lesson[] | null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare lessonReviews: Review[] | null;
  declare reviewCount: number | null;
  declare rating: number | null;
}

Instructor.init(
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
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profession: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    languages: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    socialLinks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "instructors",
    sequelize,
  },
);

export default Instructor;
