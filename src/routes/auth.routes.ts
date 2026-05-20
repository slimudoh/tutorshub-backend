import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
  resendToken,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controllers";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";
import { findUserByEmail } from "../services/user.services";

const router = Router();

router.post(
  "/register",
  check("firstName").notEmpty().withMessage("Your first name is required."),
  check("lastName").notEmpty().withMessage("Your last name is required."),
  check("password")
    .notEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must not be less than 8 characters."),
  check("emailAddress")
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid e-mail address.")
    .normalizeEmail()
    .custom(async (value) => {
      const user = await findUserByEmail(value);
      if (user) {
        throw new Error("Email address already taken.");
      }
    }),
  check("country").notEmpty().withMessage("Country of residence is required."),
  Validate,
  registerUser,
);

router.post(
  "/login",
  check("emailAddress")
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid e-mail address.")
    .normalizeEmail()
    .custom(async (value) => {
      const user = await findUserByEmail(value);
      if (!user) {
        throw new Error("Email address not found.");
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must not be less than 8 characters."),
  Validate,
  loginUser,
);

router.post(
  "/verify-email",
  check("id")
    .notEmpty()
    .withMessage("Something went wrong. Please try again later."),
  check("token").notEmpty().withMessage("Token is required."),
  Validate,
  verifyEmail,
);

router.post(
  "/forgot-password",
  check("emailAddress")
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid e-mail address.")
    .normalizeEmail()
    .custom(async (value) => {
      const user = await findUserByEmail(value);
      if (!user) {
        throw new Error("Email address not found.");
      }
    }),
  Validate,
  forgotPassword,
);

router.post(
  "/reset-password",
  check("id")
    .notEmpty()
    .withMessage("Something went wrong. Please try again later."),
  check("token").notEmpty().withMessage("Token is required."),
  check("password")
    .notEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must not be less than 8 characters."),
  Validate,
  resetPassword,
);

router.get("/resend-token/:id", resendToken);

router.get("/logout", logoutUser);

export default router;
