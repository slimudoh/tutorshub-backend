import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getUserSettings,
  updateNotificationSettings,
} from "../controllers/settings.controllers";
import Validate from "../middlewares/validate.middlewares";
import { check } from "express-validator";

const router = Router();

// router.get("/", isAuth, isUser, getUserSettings);
// router.patch(
//   "/notifications",
//   isAuth,
//   isUser,
//   check("notification")
//     .notEmpty()
//     .withMessage("Your notification settings is required."),
//   Validate,
//   updateNotificationSettings,
// );

export default router;
