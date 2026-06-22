import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getAdminReviews,
  getUserReviews,
  getHomeReviews,
  createReview,
  getReviewsByInstructor,
  replyUserReview,
} from "../controllers/review.controllers";
import isAdmin from "../middlewares/admin.middlewares";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";
import isInstructor from "../middlewares/instructor.middlewares";

const router = Router();

router.get("/user-reviews", isAuth, isUser, getUserReviews);

router.get("/admin-reviews", isAuth, isAdmin, getAdminReviews);

router.get("/home-reviews", getHomeReviews);

router.post(
  "/create-reviews",
  check("id").notEmpty().withMessage("Lesson ID is required."),
  check("rating").notEmpty().withMessage("Rating is required."),
  check("title").notEmpty().withMessage("Title is required."),
  check("experience").notEmpty().withMessage("Experience is required."),
  Validate,
  isAuth,
  isUser,
  createReview,
);

router.post(
  "/comment-reply",
  check("reviewId").notEmpty().withMessage("Review ID is required."),
  check("comment").notEmpty().withMessage("Comment is required."),
  Validate,
  isAuth,
  isInstructor,
  replyUserReview,
);

router.get("/instructors/:id", getReviewsByInstructor);

export default router;
