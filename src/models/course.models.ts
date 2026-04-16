import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Course extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare title: string | null;
  declare description: string | null;
  declare level: string | null;
  declare status: string | null;
  declare category: string | null;
  declare language: string | null;
  declare duration: string | null;
  declare isLive: boolean | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Course.init(
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
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isLive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    tableName: "courses",
    sequelize,
  },
);

export default Course;
