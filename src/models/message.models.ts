import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class Message extends Model {
  declare id: string | null;
  declare senderId: string | null;
  declare receiverId: string | null;
  declare title: string | null;
  declare message: string | null;
  declare isDeleted: boolean | null;
  declare isRead: boolean | null;
  declare isDelivered: boolean | null;
  declare readAt: Date | null;
  declare deliveredAt: Date | null;
  declare deletedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "messages",
    sequelize,
  },
);

export default Message;
