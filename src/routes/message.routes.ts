import { Router } from "express";
import {
  createGuestMessage,
  createUserMessage,
  getAllMessages,
  getMessage,
  reviewMessages,
} from "../controllers/message.controllers";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import isAdmin from "../middlewares/admin.middlewares";

const router = Router();

router.get("/admin", isAuth, isAdmin, getAllMessages);

router.get("/admin/:id", isAuth, isAdmin, getMessage);

router.post(
  "/guest",
  check("name").notEmpty().withMessage("Name is required."),
  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Email is invalid."),
  check("subject").notEmpty().withMessage("Subject is required."),
  check("message").notEmpty().withMessage("Message is required."),
  Validate,
  createGuestMessage,
);

router.post(
  "/users",
  check("subject").notEmpty().withMessage("Subject is required."),
  check("message").notEmpty().withMessage("Message is required."),
  Validate,
  isAuth,
  isUser,
  createUserMessage,
);

router.patch(
  "/review-messages",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewMessages,
);

export default router;
