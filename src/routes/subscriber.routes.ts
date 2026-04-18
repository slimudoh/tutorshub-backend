import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import {
  getAllSubcribers,
  getUserSubcribers,
} from "../controllers/subscriber.controllers";
import isUser from "../middlewares/user.middlewares";

const router = Router();

router.get("/admin-subscribers", isAuth, isAdmin, getAllSubcribers);
router.get("/user-subscribers", isAuth, isUser, getUserSubcribers);

export default router;
