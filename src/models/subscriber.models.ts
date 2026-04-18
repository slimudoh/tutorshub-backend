import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Subscriber extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Subscriber.init(
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "subscribers",
    sequelize,
  },
);

export default Subscriber;
