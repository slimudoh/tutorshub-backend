import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  addInstructor,
  getInstructors,
  getInstructor,
  reviewInstructors,
  updateInstructor,
} from "../controllers/instructor.controllers";
import Validate from "../middlewares/validate.middlewares";
import { check } from "express-validator";
import isAdmin from "../middlewares/admin.middlewares";
import isInstructor from "../middlewares/instructor.middlewares";

const router = Router();

router.get("/", isAuth, isAdmin, getInstructors);

router.post(
  "/",
  check("bio").notEmpty().withMessage("Your bio is required."),
  check("languages").notEmpty().withMessage("Your languages are required."),
  check("skills").notEmpty().withMessage("Your skills are required."),
  Validate,
  isAuth,
  isUser,
  addInstructor,
);

router.patch(
  "/update-instructor",
  check("bio").notEmpty().withMessage("Your bio is required."),
  check("languages").notEmpty().withMessage("Your languages are required."),
  check("skills").notEmpty().withMessage("Your skills are required."),
  Validate,
  isAuth,
  isInstructor,
  updateInstructor,
);

router.patch(
  "/review-instructors",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewInstructors,
);

router.get("/:id", isAuth, isAdmin, getInstructor);

export default router;
