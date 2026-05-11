import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class InstructorEarning extends Model {
  declare id: string | null;
  declare instructorId: string | null;
  declare lessonId: string | null;
  declare studentsCount: number | null;
  declare amount: number | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

InstructorEarning.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    instructorId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    studentsCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "instructorEarnings",
    sequelize,
  },
);

export default InstructorEarning;
