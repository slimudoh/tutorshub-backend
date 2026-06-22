import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";
import User from "./user.models";
import Category from "./category.models";
import Instructor from "./instructor.models";
import Review from "./review.models";

class Lesson extends Model {
  declare id: string | null;
  declare slug: string | null;
  declare userId: string | null;
  declare categoryId: string | null;
  declare title: string | null;
  declare description: string | null;
  declare level: string | null;
  declare language: string | null;
  declare isLive: boolean | null;
  declare isFree: boolean | null;
  declare creditsRequired: number | null;
  declare maxStudents: number | null;
  declare durationMinutes: number | null;
  declare lateJoinMinutes: number | null;
  declare lessonDate: Date | null;
  declare startTime: string | null;
  declare endTime: string | null;
  declare status: string | null;
  declare image: string | null;
  declare lectures: string | null;
  declare seoTitle: string | null;
  declare seoDescription: string | null;
  declare seoTags: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare user: User | null;
  declare instructor: Instructor | null;
  declare category: Category | null;
  declare wishlist: boolean | null;
  declare enrolled: boolean | null;
  declare enrollees: number | null;
  declare reviewCount: number | null;
  declare rating: number | null;
  declare seatsLeft: number | null;
  declare lessonAttendance: User[] | null;
  declare lessonReviews: Review[] | null;
  declare isReviewedByUser: boolean | null;
  declare canReview: boolean | null;
}

Lesson.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
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
    durationMinutes: {
      type: DataTypes.INTEGER,
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
    lessonDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lectures: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    seoTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    seoTags: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "lesson",
    sequelize,
  },
);

export default Lesson;
