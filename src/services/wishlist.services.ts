import WishList from "../models/wishlist.models";
import Lesson from "../models/lesson.models";
import { Op } from "sequelize";
import { LESSON_EXCLUDED_ATTRIBUTES } from "../utils/constant";
import { getLessonsDependencies } from "./lesson.services";

export const getWishList = async (userId: string) => {
  const wishlists = await WishList.findAll({
    where: { userId },
    raw: true,
  });

  if (!wishlists.length) return [];

  const lessonIds = wishlists.map((w) => w.lessonId).filter(Boolean);

  const lessons = await Lesson.findAll({
    where: { id: { [Op.in]: lessonIds } },
    attributes: { exclude: LESSON_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  const lessonsWithDependencies = await getLessonsDependencies(lessons, userId);

  return wishlists.map((wishlist) => ({
    ...wishlist,
    lesson:
      lessonsWithDependencies.find((l) => l.id === wishlist.lessonId) || null,
  }));
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
