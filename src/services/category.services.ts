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

export const fetchPopularCategories = async () => {
  const lessons = await Lesson.findAll({
    where: { status: LESSON.ACTIVE },
    raw: true,
  });

  const categories = await Category.findAll({
    where: { status: CATEGORY.ACTIVE },
    raw: true,
  });

  const popularCategories = categories
    .map((category) => ({
      ...category,
      lessonCount: lessons.filter((lesson) => lesson.categoryId === category.id)
        .length,
    }))
    .filter((category) => category.lessonCount > 0)
    .sort((a, b) => b.lessonCount - a.lessonCount)
    .slice(0, 10);

  return popularCategories;
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
      id: id,
    },
    raw: true,
  });
};

export const findCategoryBySlug = async (slug: string) => {
  return await Category.findOne({
    where: {
      slug: slug,
    },
    raw: true,
  });
};

export const findCategoryByTitle = async (title: string) => {
  return await Category.findOne({
    where: {
      title: title,
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
  slug: string;
  description: string;
  userId: string;
  image: string | null;
}) => {
  return await Category.update(
    {
      title: data.title,
      slug: data.slug,
      description: data.description,
      image: data.image,
      userId: data.userId,
    },
    { where: { id: data.id } },
  );
};
