import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getMessages,
  markMessageAsRead,
  deleteMessage,
} from "../controllers/message.controllers";

const router = Router();

router.get("/", isAuth, isUser, getMessages);

router.put("/:id", isAuth, isUser, markMessageAsRead);

router.delete("/:id", isAuth, isUser, deleteMessage);

export default router;
