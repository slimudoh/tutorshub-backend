import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class PricingPlan extends Model {
  declare id: string | null;
  declare name: string | null;
  declare amount: number | null;
  declare description: string | null;
  declare duration: number | null;
  declare features: string[] | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PricingPlan.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "pricingPlans",
    sequelize,
  },
);

export default PricingPlan;
