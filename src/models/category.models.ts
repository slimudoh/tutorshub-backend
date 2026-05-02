import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Category extends Model {
  declare id: string | null;
  declare title: string | null;
  declare slug: string | null;
  declare image: string | null;
  declare description: string | null;
  declare status: string | null;
  declare lessonCount: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "categories",
    sequelize,
  },
);

export default Category;
