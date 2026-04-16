import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class SubscriptionPlan extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare planId: string | null;
  declare status: string | null;
  declare startDate: Date;
  declare endDate: Date;
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
      allowNull: false,
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "subscriptionPlans",
    sequelize,
  },
);

export default SubscriptionPlan;
