import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import {
  createNewCategory,
  fetchActiveCategories,
  fetchPopularCategories,
  findCategoryById,
  findCategoryBySlug,
  findCategoryByTitle,
  getAdminCategories,
  updateCategoryStatus,
  updateCurrentCategory,
} from "../services/category.services";
import { ResponseError } from "../interfaces";
import { CATEGORY } from "../utils/constant";
import { findUserById } from "../services/user.services";
import { createAuditLog } from "../services/auditLog.services";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getCategories: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword } = request.query;

    const categories = await fetchActiveCategories(keyword as string);

    response.status(201).json({
      data: categories,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getCategoryBySlug: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { slug } = request.params;

    const category = await findCategoryBySlug(slug);

    response.status(201).json({
      data: category,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getPopularCategories: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const popularCategories = await fetchPopularCategories();

    response.status(201).json({
      data: popularCategories,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getCategory: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const category = await findCategoryById(id);

    if (!category) {
      const error = new Error(
        "Category not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    response.status(201).json({
      data: category,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllCategories: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, status } = request.query;

    const category = await getAdminCategories(
      keyword as string,
      status as string,
    );

    response.status(201).json({
      data: category,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewAdminCategories: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id, status } = request.body;
    const userId = (request as CustomRequest).user?.id;

    const category = await findCategoryById(id);

    if (!category) {
      const error = new Error(
        "Category not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (status !== CATEGORY.ACTIVATE && status !== CATEGORY.SUSPEND) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === CATEGORY.PENDING) {
      const error = new Error(
        "Category is in PENDING status. You cannot review a pending category.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (category.status === status) {
      const error = new Error(
        "Category is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newStatus =
      status === CATEGORY.ACTIVATE ? CATEGORY.ACTIVE : CATEGORY.SUSPENDED;

    await updateCategoryStatus(id, newStatus);

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: newStatus,
      oldData: JSON.stringify(category),
      newData: JSON.stringify({
        ...category,
        status: newStatus,
      }),
      section: "REVIEW CATEGORY",
    });

    response.status(201).json({
      message: "Category reviewed successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const createCategory: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { title, description } = request.body;
    const userId = (request as CustomRequest).user?.id;
    const file = request.file;

    const existingCategory = await findCategoryByTitle(title);

    if (existingCategory) {
      const error = new Error("Category already exists.") as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const slug = title.toLowerCase().replace(/\s+/g, "-");

    const existingCategoryBySlug = await findCategoryBySlug(slug);

    if (existingCategoryBySlug) {
      const error = new Error(
        `Category with this slug ${slug} already exists.`,
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const category = await createNewCategory({
      title,
      slug,
      description,
      userId,
      image: file?.filename || null,
    });

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "CREATE CATEGORY",
      newData: JSON.stringify(category),
      section: "CREATE CATEGORY",
    });

    response.status(201).json({
      message: "Category created successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const updateCategory: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;
    const { title, description } = request.body;
    const file = request.file;
    const userId = (request as CustomRequest).user?.id;

    const category = await findCategoryById(id);

    if (!category) {
      const error = new Error(
        "Category not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    let slug = title.toLowerCase().replace(/\s+/g, "-");

    const existingCategoryBySlug = await findCategoryBySlug(slug);

    if (existingCategoryBySlug && existingCategoryBySlug.id !== id) {
      const error = new Error(
        `Category with this slug ${slug} already exists.`,
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    await updateCurrentCategory(id, {
      title,
      slug,
      description,
      userId,
      image: file?.filename || category?.image || null,
    });

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "UPDATE CATEGORY",
      oldData: JSON.stringify(category),
      newData: JSON.stringify({
        ...category,
        title,
        slug,
        description,
        image: file?.filename || category?.image || null,
      }),
      section: "UPDATE CATEGORY",
    });

    response.status(201).json({
      message: "Category updated successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
