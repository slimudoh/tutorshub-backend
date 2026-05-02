import { Router } from "express";
import {
  getAllCategories,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  reviewAdminCategories,
  getPopularCategories,
  getCategoryBySlug,
} from "../controllers/category.controllers";
import isAdmin from "../middlewares/admin.middlewares";
import isAuth from "../middlewares/auth.middlewares";
import Validate from "../middlewares/validate.middlewares";
import { check } from "express-validator";
import { imageUpload } from "../utils/file";

const router = Router();

router.get("/", getCategories);

router.get("/popular", getPopularCategories);

router.get("/admin", isAuth, isAdmin, getAllCategories);

router.patch(
  "/review-admin-categories",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewAdminCategories,
);

router.post(
  "/",
  imageUpload.single("file"),
  check("title").notEmpty().withMessage("Title is required."),
  check("description").notEmpty().withMessage("Description is required."),
  Validate,
  isAuth,
  isAdmin,
  createCategory,
);

router.post(
  "/:id",
  imageUpload.single("file"),
  check("title").notEmpty().withMessage("Title is required."),
  check("description").notEmpty().withMessage("Description is required."),
  Validate,
  isAuth,
  isAdmin,
  updateCategory,
);

router.get("/slugs/:slug", getCategoryBySlug);

router.get("/:id", getCategory);

export default router;
