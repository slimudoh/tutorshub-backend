import { Router } from "express";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";
import isUser from "../middlewares/user.middlewares";
import { imageUpload } from "../utils/file";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import {
  submitReport,
  getAllReports,
  getReport,
  reviewReports,
} from "../controllers/report.controllers";

const router = Router();

router.get("/", isAuth, isAdmin, getAllReports);

router.get("/:id", isAuth, isAdmin, getReport);

router.patch(
  "/review-reports",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewReports,
);

router.post(
  "/",
  imageUpload.single("file"),
  check("report").notEmpty().withMessage("Report type is required."),
  check("session").notEmpty().withMessage("Session ID is required."),
  check("description").notEmpty().withMessage("Description is required."),
  check("date").notEmpty().withMessage("Date of incident is required."),
  Validate,
  isAuth,
  isUser,
  submitReport,
);

export default router;
