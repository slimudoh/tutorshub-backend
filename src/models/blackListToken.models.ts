import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class BlackListToken extends Model {
  declare id: string | null;
  declare token: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

BlackListToken.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "blackListTokens",
    sequelize,
  },
);

export default BlackListToken;
