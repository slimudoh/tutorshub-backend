import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Report extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare sessionId: string | null;
  declare reportType: string | null;
  declare description: string | null;
  declare incidentDate: string | null;
  declare evidenceFile: string | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Report.init(
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
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reportType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    incidentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    evidenceFile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "reports",
    sequelize,
  },
);

export default Report;
