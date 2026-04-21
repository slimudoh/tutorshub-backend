import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import {
  getAllSubcribers,
  getUserSubcribers,
} from "../controllers/enrollee.controllers";
import isUser from "../middlewares/user.middlewares";

const router = Router();

router.get("/admin-enrollees", isAuth, isAdmin, getAllSubcribers);
router.get("/user-enrollees", isAuth, isUser, getUserSubcribers);

export default router;
