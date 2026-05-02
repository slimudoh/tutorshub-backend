import { Router } from "express";
import {
  submitNewsletter,
  getSubscribers,
  deleteSubscriber,
} from "../controllers/newsletter.controllers";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";

const router = Router();

router.post(
  "/",
  check("email").notEmpty().withMessage("Email address is required."),
  Validate,
  submitNewsletter,
);

router.get("/", isAuth, isAdmin, getSubscribers);

router.delete("/:id", isAuth, isAdmin, deleteSubscriber);

export default router;
