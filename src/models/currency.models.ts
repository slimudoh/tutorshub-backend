import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Currency extends Model {
  declare id: string | null;
  declare country: string | null;
  declare countryCode: string | null;
  declare currency: string | null;
  declare symbol: string | null;
  declare amount: string | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Currency.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "currencies",
    sequelize,
  },
);

export default Currency;
