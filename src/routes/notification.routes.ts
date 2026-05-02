import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notification.controllers";

const router = Router();

router.get("/", isAuth, isUser, getNotifications);

// router.put("/:id", isAuth, isUser, markNotificationAsRead);

// router.delete("/:id", isAuth, isUser, deleteNotification);

export default router;
