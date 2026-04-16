import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import { getWishList } from "../services/wishlist.services";
import { findAllCoursesByIds } from "../services/course.services";
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

    const courseIds = wishList.map((item: WishList) => item.courseId);

    if (!courseIds.length) {
      return response.status(201).json({
        data: [],
      });
    }

    const filteredCourseIds = courseIds.filter(
      (id: string | null) => id !== null,
    );

    const courses = await findAllCoursesByIds(filteredCourseIds);

    response.status(201).json({
      data: courses,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};
