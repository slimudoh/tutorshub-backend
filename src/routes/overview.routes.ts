import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import { getOverview } from "../controllers/overview.controllers";

const router = Router();

router.get("/", isAuth, isUser, getOverview);

export default router;
