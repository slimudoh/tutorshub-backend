import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getNotifications,
  readAllNotifications,
  getNotificationById,
} from "../controllers/notification.controllers";

const router = Router();

router.get("/", isAuth, isUser, getNotifications);

router.patch("/read-all-notifications", isAuth, isUser, readAllNotifications);

router.get("/:id", isAuth, isUser, getNotificationById);

export default router;
