import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class ReviewComment extends Model {
  declare id: string | null;
  declare reviewId: string | null;
  declare comment: string | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ReviewComment.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    reviewId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "reviewComments",
    sequelize,
  },
);

export default ReviewComment;
