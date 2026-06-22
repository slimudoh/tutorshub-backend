import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import {
  getAllEnrollees,
  getUserEnrollees,
  getLessonEnrollees,
} from "../controllers/enrollee.controllers";
import isUser from "../middlewares/user.middlewares";

const router = Router();

router.get("/admin-enrollees", isAuth, isAdmin, getAllEnrollees);
router.get("/lesson-enrollees/:id", isAuth, isUser, getLessonEnrollees);
router.get("/user-enrollees", isAuth, isUser, getUserEnrollees);

export default router;
