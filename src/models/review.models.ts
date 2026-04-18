import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Review extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare rating: number | null;
  declare comment: string | null;
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
      allowNull: false,
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "reviews",
    sequelize,
  },
);

export default Review;
