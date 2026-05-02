import { Router } from "express";
import {
  getAllActiveLessons,
  getAllUserLessons,
  getAllLessons,
  reviewAdminLessons,
  getLiveSessionsLessons,
  getMyLessonHistory,
  getHomeLessons,
  getLessonsByCategory,
} from "../controllers/lesson.controllers";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import isUser from "../middlewares/user.middlewares";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";

const router = Router();

// router.get("/", getAllActiveLessons);

router.get("/categories/:slug", getLessonsByCategory);

router.get("/live-sessions", getLiveSessionsLessons);

// router.get("/admin", isAuth, isAdmin, getAllLessons);

// router.get("/users", isAuth, isUser, getAllUserLessons);

// router.get("/histories", isAuth, isUser, getMyLessonHistory);

router.get("/home-lessons", getHomeLessons);

// router.patch(
//   "/review-admin-lesson",
//   check("id").notEmpty().withMessage("ID is required."),
//   check("status").notEmpty().withMessage("Status is required."),
//   Validate,
//   isAuth,
//   isAdmin,
//   reviewAdminLessons,
// );

export default router;
