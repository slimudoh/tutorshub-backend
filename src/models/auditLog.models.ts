import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class AuditLog extends Model {
  declare id: string | null;
  declare user: string | null;
  declare action: string | null;
  declare oldData: string | null;
  declare newData: string | null;
  declare section: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    user: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    oldData: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newData: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    section: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "auditLogs",
    sequelize,
  },
);

export default AuditLog;
