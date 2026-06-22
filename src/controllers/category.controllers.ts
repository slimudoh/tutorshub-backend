import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError, makeError } from "../services/error.services";
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
import { CATEGORY } from "../utils/constant";
import { findUserById } from "../services/user.services";
import { createAuditLog } from "../services/auditLog.services";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { deleteFile } from "../utils/file";
import { toSlug } from "../utils/formatter";

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

    response.status(200).json({
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

    if (!category) {
      return next(
        makeError("Category not found. Please try again later.", 404),
      );
    }

    response.status(200).json({
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

    response.status(200).json({
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
      return next(
        makeError("Category not found. Please try again later.", 404),
      );
    }

    response.status(200).json({
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

    response.status(200).json({
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

    if (status !== CATEGORY.ACTIVATE && status !== CATEGORY.SUSPEND) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const category = await findCategoryById(id);
    if (!category) {
      return next(
        makeError("Category not found. Please try again later.", 404),
      );
    }

    const newStatus =
      status === CATEGORY.ACTIVATE ? CATEGORY.ACTIVE : CATEGORY.SUSPENDED;

    if (category.status === newStatus) {
      return next(
        makeError(
          "Category is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    await updateCategoryStatus(id, newStatus);

    const reviewerId = (request as CustomRequest).user?.id;
    const reviewer = await findUserById(reviewerId);

    await createAuditLog({
      user: JSON.stringify(reviewer),
      action: "REVIEW CATEGORY",
      oldData: JSON.stringify(category),
      newData: JSON.stringify({ ...category, status: newStatus }),
      section: "CATEGORY",
    });

    response.status(200).json({ message: "Category reviewed successfully." });
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
    const creatorId = (request as CustomRequest).user?.id;
    const slug = toSlug(title);

    const [creator, existingByTitle, existingBySlug] = await Promise.all([
      findUserById(creatorId),
      findCategoryByTitle(title),
      findCategoryBySlug(slug),
    ]);

    if (existingByTitle) {
      return next(makeError("Category already exists.", 400));
    }

    if (existingBySlug) {
      return next(
        makeError(`Category with slug "${slug}" already exists.`, 400),
      );
    }

    const category = await createNewCategory({
      title,
      slug,
      description,
      userId: creator?.id ?? "",
      image: request.file?.filename ?? null,
    });

    await createAuditLog({
      user: JSON.stringify(creator),
      action: "CREATE CATEGORY",
      newData: JSON.stringify(category),
      section: "CATEGORY",
    });

    response.status(201).json({ message: "Category created successfully." });
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
    const updaterId = (request as CustomRequest).user?.id;
    const slug = toSlug(title);

    const [category, existingBySlug, existingByTitle, updater] =
      await Promise.all([
        findCategoryById(id),
        findCategoryBySlug(slug),
        findCategoryByTitle(title),
        findUserById(updaterId),
      ]);

    if (!category) {
      return next(
        makeError("Category not found. Please try again later.", 404),
      );
    }

    if (existingBySlug && existingBySlug.id !== id) {
      return next(
        makeError(`Category with slug "${slug}" already exists.`, 400),
      );
    }

    if (existingByTitle && existingByTitle.id !== id) {
      return next(
        makeError(`Category with name "${title}" already exists.`, 400),
      );
    }

    if (request.file?.filename && category.image) {
      await deleteFile(category.image);
    }

    const updatedCategory = await updateCurrentCategory({
      id,
      title,
      description,
      userId: updater?.id ?? "",
      image: request.file?.filename ?? category.image ?? null,
    });

    await createAuditLog({
      user: JSON.stringify(updater),
      action: "UPDATE CATEGORY",
      oldData: JSON.stringify(category),
      newData: JSON.stringify(updatedCategory),
      section: "CATEGORY",
    });

    response.status(200).json({ message: "Category updated successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
