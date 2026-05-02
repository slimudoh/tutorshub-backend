import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

// id
// user_id
// plan_id
// credits_remaining
// expiry_date

class SubscriptionPlan extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare planId: string | null;
  declare creditsBalance: number | null;
  declare startDate: Date;
  declare endDate: Date;
  declare status: string | null;
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
    creditsBalance: {
      type: DataTypes.INTEGER,
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
