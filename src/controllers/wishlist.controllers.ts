import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import { getWishList } from "../services/wishlist.services";
import { findAllLessonsByIds } from "../services/lesson.services";
import WishList from "../models/wishlist.models";

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

    const lessonIds = wishList.map((item: WishList) => item.lessonId);

    if (!lessonIds.length) {
      return response.status(201).json({
        data: [],
      });
    }

    const filteredLessonIds = lessonIds.filter(
      (id: string | null) => id !== null,
    );

    const lesson = await findAllLessonsByIds(filteredLessonIds);

    response.status(201).json({
      data: lesson,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
