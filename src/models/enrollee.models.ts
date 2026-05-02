import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Enrollee extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Enrollee.init(
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
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "enrollees",
    sequelize,
  },
);

export default Enrollee;
