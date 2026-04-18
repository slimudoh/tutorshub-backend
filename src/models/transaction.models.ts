import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Transaction extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare amount: number | null;
  declare currency: string | null;
  declare reference: string | null;
  declare status: string | null;
  declare channel: string | null;
  declare transactionType: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Transaction.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    channel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "transactions",
    sequelize,
  },
);

export default Transaction;
