import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Rate extends Model {
  declare id: string | null;
  declare fromCurrency: string | null;
  declare toCurrency: string | null;
  declare amount: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Rate.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    fromCurrency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    toCurrency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "rates",
    sequelize,
  },
);

export default Rate;
