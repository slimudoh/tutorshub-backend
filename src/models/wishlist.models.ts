import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db";

class WishList extends Model {
  declare id: string | null;
  declare userId: string | null;
  declare lessonId: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

WishList.init(
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    lessonId: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "wishlists", sequelize },
);

export default WishList;
