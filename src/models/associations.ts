import WishList from "./wishlist.models";
import Lesson from "./lesson.models";
import Transaction from "./transaction.models";
import User from "./user.models";

export const defineAssociations = () => {
  WishList.belongsTo(Lesson, { foreignKey: "lessonId", as: "lesson" });
  Lesson.hasMany(WishList, { foreignKey: "lessonId", as: "wishlists" });
  Transaction.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Transaction, { foreignKey: "userId", as: "transactions" });
};
