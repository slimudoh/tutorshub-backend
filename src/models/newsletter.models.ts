import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Newsletter extends Model {
  declare id: string | null;
  declare email: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Newsletter.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "newsletters",
    sequelize,
  },
);

export default Newsletter;
