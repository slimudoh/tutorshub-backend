import { Router } from "express";
import {
  getAllActiveCourses,
  getAllUserCourses,
  getAllCourses,
  reviewAdminCourses,
  getLiveSessionsCourses,
  getMyCourseHistory,
} from "../controllers/course.controllers";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import isUser from "../middlewares/user.middlewares";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";

const router = Router();

router.get("/", getAllActiveCourses);

router.get("/live-sessions", getLiveSessionsCourses);

router.get("/admin", isAuth, isAdmin, getAllCourses);

router.get("/users", isAuth, isUser, getAllUserCourses);

router.get("/histories", isAuth, isUser, getMyCourseHistory);

router.patch(
  "/review-admin-courses",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewAdminCourses,
);

export default router;
