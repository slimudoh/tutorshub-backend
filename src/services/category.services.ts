import { Op } from "@sequelize/core";
import Category from "../models/category.models";
import { CATEGORY, LESSON } from "../utils/constant";
import Lesson from "../models/lesson.models";

export const fetchActiveCategories = async (keyword: string) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }],
    };
  }

  return await Category.findAll({
    where: { status: CATEGORY.ACTIVE, ...where },
    order: [["createdAt", "DESC"]],
    raw: true,
  });
};

export const fetchPopularCategories = async (limit = 10) => {
  const [lessons, categories] = await Promise.all([
    Lesson.findAll({
      where: { status: LESSON.ACTIVE },
      attributes: ["categoryId"],
      raw: true,
    }),
    Category.findAll({
      where: { status: CATEGORY.ACTIVE },
      raw: true,
    }),
  ]);

  const lessonCountMap = new Map<string, number>();
  for (const lesson of lessons) {
    if (!lesson.categoryId) continue;
    lessonCountMap.set(
      lesson.categoryId,
      (lessonCountMap.get(lesson.categoryId) ?? 0) + 1,
    );
  }

  return categories
    .map((category) => ({
      ...category,
      lessonCount: lessonCountMap.get(category.id ?? "") ?? 0,
    }))
    .filter((category) => category.lessonCount > 0)
    .sort((a, b) => b.lessonCount - a.lessonCount)
    .slice(0, limit);
};

export const getAdminCategories = async (keyword?: string, status?: string) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }],
    };
  }

  if (status) {
    where = {
      ...where,
      status,
    };
  }

  return await Category.findAll({
    where: { ...where },
    order: [["createdAt", "DESC"]],
    raw: true,
  });
};

export const findCategoryById = async (id: string) => {
  return await Category.findOne({
    where: {
      id,
    },
    raw: true,
  });
};

export const findCategoryBySlug = async (slug: string) => {
  return await Category.findOne({
    where: {
      slug,
    },
    raw: true,
  });
};

export const findCategoryByTitle = async (title: string) => {
  return await Category.findOne({
    where: {
      title,
    },
    raw: true,
  });
};

export const updateCategoryStatus = async (id: string, status: string) => {
  await Category.update({ status }, { where: { id } });
};

export const createNewCategory = async (data: {
  title: string;
  slug: string;
  description: string;
  userId: string;
  image: string | null;
}) => {
  return await Category.create({
    id: crypto.randomUUID(),
    slug: data.slug,
    title: data.title,
    description: data.description,
    image: data.image,
    userId: data.userId,
    status: CATEGORY.ACTIVE,
  });
};

export const updateCurrentCategory = async (data: {
  id: string;
  title: string;
  description: string;
  userId: string;
  image: string | null;
}) => {
  return await Category.update(
    {
      title: data.title,
      description: data.description,
      image: data.image,
      userId: data.userId,
    },
    { where: { id: data.id } },
  );
};

export const findAllCategories = async () => {
  return await Category.findAll({
    raw: true,
  });
};
