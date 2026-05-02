import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class ContactMessage extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare name: string | null;
  declare email: string | null;
  declare subject: string | null;
  declare message: string | null;
  declare status: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ContactMessage.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "contactMessages",
    sequelize,
  },
);

export default ContactMessage;
