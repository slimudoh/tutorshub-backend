import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";
import User from "./user.models";

class Instructor extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare bio: string | null;
  declare languages: string[] | null;
  declare skills: string[] | null;
  declare status: string | null;
  declare user: User | null;
  declare createdAt: Date;
  declare updatedAt: Date;
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
    bio: {
      type: DataTypes.TEXT,
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
