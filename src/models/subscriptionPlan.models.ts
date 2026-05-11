import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";
import PricingPlan from "./pricingPlan.models";

class SubscriptionPlan extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare planId: string | null;
  declare subscriptionNumber: string | null;
  declare autoRenew: boolean | null;
  declare provider: string | null;
  declare startDate: Date | null;
  declare endDate: Date | null;
  declare creditsBalance: number | null;
  declare status: string | null;
  declare plan: PricingPlan | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

SubscriptionPlan.init(
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
    planId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    subscriptionNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    creditsBalance: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "subscriptionPlans",
    sequelize,
  },
);

export default SubscriptionPlan;
