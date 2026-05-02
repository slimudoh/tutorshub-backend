import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import { getUserWishList } from "../controllers/wishlist.controllers";

const router = Router();

// router.get("/", isAuth, isUser, getUserWishList);

export default router;
