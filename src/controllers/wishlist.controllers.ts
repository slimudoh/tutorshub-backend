import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError, makeError } from "../services/error.services";
import {
  createNewWishList,
  getWishList,
  getWishListByLessonId,
  removeLessonFromWishList,
} from "../services/wishlist.services";
import { findLessonById } from "../services/lesson.services";
import WishList from "../models/wishlist.models";
import { createAuditLog } from "../services/auditLog.services";
import { findUserById } from "../services/user.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getUserWishList: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const wishList = await getWishList(userId);

    response.status(200).json({
      data: wishList,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const addToWishList: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { id } = request.body;

    const lesson = await findLessonById(id);

    if (!lesson?.id) {
      return next(makeError("Lesson not found.", 404));
    }

    const wishList = await getWishListByLessonId(userId, lesson?.id);

    if (wishList) {
      return next(makeError("Lesson already exists in wishlist.", 400));
    }

    await createNewWishList(userId, id);
    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "ADD TO WISHLIST",
      newData: JSON.stringify(lesson),
      section: "WISHLIST",
    });

    response.status(200).json({
      message: "Lesson added to wishlist successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const removeFromWishList: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { id } = request.params;

    const lesson = await findLessonById(id);

    if (!lesson) {
      return next(makeError("Lesson not found.", 404));
    }

    const existing = await getWishListByLessonId(userId, id);

    if (!existing) {
      return next(makeError("Lesson not found in wishlist.", 404));
    }

    await removeLessonFromWishList(userId, id);
    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "REMOVE FROM WISHLIST",
      newData: JSON.stringify(lesson),
      section: "WISHLIST",
    });

    response.status(200).json({
      message: "Lesson removed from wishlist successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
