import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getAdminReviews,
  getUserReviews,
} from "../controllers/review.controllers";
import isAdmin from "../middlewares/admin.middlewares";

const router = Router();

router.get("/user-reviews", isAuth, isUser, getUserReviews);

router.get("/admin-reviews", isAuth, isAdmin, getAdminReviews);

export default router;
