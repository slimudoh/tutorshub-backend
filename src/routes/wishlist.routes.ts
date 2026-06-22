import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  getUserWishList,
  addToWishList,
  removeFromWishList,
} from "../controllers/wishlist.controllers";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";

const router = Router();

router.get("/", isAuth, isUser, getUserWishList);

router.post(
  "/",
  check("id").notEmpty().withMessage("Lesson ID is required."),
  Validate,
  isAuth,
  isUser,
  addToWishList,
);

router.delete("/:id", isAuth, isUser, removeFromWishList);

export default router;
