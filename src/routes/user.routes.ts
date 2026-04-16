import { Router } from "express";
import {
  getUsers,
  getUser,
  getProfile,
  reviewUsers,
  updateProfile,
  removeAvatar,
  updateAvatar,
  getUserAvatar,
  deleteUsers,
} from "../controllers/user.controllers";
import isAdmin from "../middlewares/admin.middlewares";
import isUser from "../middlewares/user.middlewares";
import isAuth from "../middlewares/auth.middlewares";
import { imageUpload } from "../utils/file";
import Validate from "../middlewares/validate.middlewares";
import { check } from "express-validator";

const router = Router();

router.get("/", isAuth, isAdmin, getUsers);
router.get("/profile", isAuth, isUser, getProfile);
router.get("/:id", isAuth, isAdmin, getUser);
router.patch(
  "/update-profiles",
  check("firstName").notEmpty().withMessage("Your first name is required."),
  check("lastName").notEmpty().withMessage("Your last name is required."),
  check("phoneCode").notEmpty().withMessage("Your phone code is required."),
  check("phoneNumber").notEmpty().withMessage("Your phone number is required."),
  check("profession").notEmpty().withMessage("Your profession is required."),
  check("userName").notEmpty().withMessage("Your username is required."),
  check("dateOfBirth")
    .notEmpty()
    .withMessage("Your date of birth is required."),
  check("address").notEmpty().withMessage("Your address is required."),
  check("country").notEmpty().withMessage("Your country is required."),
  Validate,
  isAuth,
  isUser,
  updateProfile,
);
router.put("/remove-avatar", isAuth, isUser, removeAvatar);
router.patch(
  "/update-avatar",
  isAuth,
  isUser,
  imageUpload.single("avatar"),
  updateAvatar,
);

router.patch(
  "/delete-users",
  check("password").notEmpty().withMessage("Your password is required."),
  check("reason").notEmpty().withMessage("Your reason is required."),
  check("description").notEmpty().withMessage("Your description is required."),
  Validate,
  isAuth,
  isUser,
  deleteUsers,
);
router.patch(
  "/review-users",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewUsers,
);

router.get("/file/:name", getUserAvatar);

export default router;
