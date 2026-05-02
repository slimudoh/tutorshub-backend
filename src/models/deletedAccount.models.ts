import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class DeletedAccount extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare reason: string | null;
  declare description: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

DeletedAccount.init(
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
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "deletedAccounts",
    sequelize,
  },
);

export default DeletedAccount;
