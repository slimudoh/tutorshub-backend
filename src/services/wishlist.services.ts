import WishList from "../models/wishlist.models";
import Lesson from "../models/lesson.models";

export const getWishList = async (userId: string) => {
  return await WishList.findAll({
    where: { userId },
    include: [{ model: Lesson, as: "lesson" }],
  });
};

export const getWishListByLessonId = async (
  userId: string,
  lessonId: string,
) => {
  return await WishList.findOne({ where: { userId, lessonId }, raw: true });
};

export const createNewWishList = async (userId: string, lessonId: string) => {
  return await WishList.create({
    id: crypto.randomUUID(),
    userId,
    lessonId,
  });
};

export const removeLessonFromWishList = async (
  userId: string,
  lessonId: string,
): Promise<number> => {
  return await WishList.destroy({ where: { userId, lessonId } });
};
