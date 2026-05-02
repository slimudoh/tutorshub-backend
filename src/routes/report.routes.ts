import { Router } from "express";
import { submitReport } from "../controllers/report.controllers";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";
import isUser from "../middlewares/user.middlewares";
import multer from "multer";

const upload = multer();

const router = Router();

router.post(
  "/",
  upload.none(),
  check("report").notEmpty().withMessage("Report type is required."),
  check("session").notEmpty().withMessage("Session ID is required."),
  check("description").notEmpty().withMessage("Description is required."),
  check("date").notEmpty().withMessage("Date of incident is required."),
  Validate,
  isUser,
  submitReport,
);

export default router;
