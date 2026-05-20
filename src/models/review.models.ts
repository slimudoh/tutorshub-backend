import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Review extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare rating: number | null;
  declare comment: string | null;
  declare isPublic: boolean | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Review.init(
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPublic: {
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
    tableName: "reviews",
    sequelize,
  },
);

export default Review;
