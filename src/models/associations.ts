import WishList from "./wishlist.models";
import Lesson from "./lesson.models";
import Transaction from "./transaction.models";
import User from "./user.models";
import LessonAttendance from "./lessonAttendance.models";
import Category from "./category.models";
import Instructor from "./instructor.models";

export const defineAssociations = () => {
  WishList.belongsTo(Lesson, { foreignKey: "lessonId", as: "lesson" });
  Lesson.hasMany(WishList, { foreignKey: "lessonId", as: "wishlists" });

  Transaction.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Transaction, { foreignKey: "userId", as: "transactions" });

  LessonAttendance.belongsTo(Lesson, { foreignKey: "lessonId", as: "lesson" });
  Lesson.hasMany(LessonAttendance, {
    foreignKey: "lessonId",
    as: "attendances",
  });

  // Lesson → Instructor
  Lesson.belongsTo(Instructor, {
    foreignKey: { name: "userId", allowNull: true },
    as: "instructor",
    hooks: false, // ← don't cascade hooks
    constraints: false, // ← don't auto-create FK constraint (manage manually)
  });
  Instructor.hasMany(Lesson, {
    foreignKey: { name: "userId", allowNull: true },
    as: "lessons",
    constraints: false,
  });

  // Lesson → Category
  Lesson.belongsTo(Category, {
    foreignKey: { name: "categoryId", allowNull: true },
    as: "category",
    constraints: false,
  });
  Category.hasMany(Lesson, {
    foreignKey: { name: "categoryId", allowNull: true },
    as: "lessons",
    constraints: false,
  });

  // Instructor → User
  Instructor.belongsTo(User, {
    foreignKey: { name: "userId", allowNull: false },
    as: "user",
    constraints: false,
  });
  User.hasOne(Instructor, {
    foreignKey: { name: "userId", allowNull: false },
    as: "instructor",
    constraints: false,
  });
};
