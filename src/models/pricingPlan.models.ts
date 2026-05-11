import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class PricingPlan extends Model {
  declare id: string | null;
  declare title: string | null;
  declare slug: string | null;
  declare description: string | null;
  declare amount: number | null;
  declare currency: string | null;
  declare billingCycle: string | null;
  declare lessonLimit: number | null;
  declare isUnlimited: boolean | null;
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
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
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
    billingCycle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lessonLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isUnlimited: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "pricingPlans",
    sequelize,
  },
);

export default PricingPlan;
