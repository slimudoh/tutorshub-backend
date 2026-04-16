import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";
import { ROLES } from "../utils/constant";
import DeletedAccount from "./deletedAccount.models";
import SubscriptionPlan from "./subscriptionPlan.models";

class User extends Model {
  declare id: string | null;
  declare avatar: string | null;
  declare firstName: string | null;
  declare lastName: string | null;
  declare userName: string | null;
  declare phoneCode: string | null;
  declare phoneNumber: string | null;
  declare emailAddress: string | null;
  declare password: string | null;
  declare role: string | null;
  declare profession: string | null;
  declare dateOfBirth: string | null;
  declare address: string | null;
  declare country: string | null;
  declare status: string | null;
  declare emailVerified: string | null;
  declare emailVerifiedAt: Date | null;
  declare token: string | null;
  declare tokenExpiry: Date | null;
  declare tokenExpiryStatus: string | null;
  declare deactivationDetails: DeletedAccount | null;
  declare subscriptionPlan: SubscriptionPlan[] | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phoneCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ROLES.USER,
    },
    profession: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailVerified: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tokenExpiryStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    sequelize,
  },
);

export default User;
