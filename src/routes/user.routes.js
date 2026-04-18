"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controllers_1 = require("../controllers/user.controllers");
const admin_middlewares_1 = __importDefault(require("../middlewares/admin.middlewares"));
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const file_1 = require("../utils/file");
const validate_middlewares_1 = __importDefault(require("../middlewares/validate.middlewares"));
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
router.get("/", auth_middlewares_1.default, admin_middlewares_1.default, user_controllers_1.getUsers);
router.get("/profile", auth_middlewares_1.default, user_middlewares_1.default, user_controllers_1.getProfile);
router.get("/:id", auth_middlewares_1.default, admin_middlewares_1.default, user_controllers_1.getUser);
router.patch("/update-profiles", (0, express_validator_1.check)("firstName").notEmpty().withMessage("Your first name is required."), (0, express_validator_1.check)("lastName").notEmpty().withMessage("Your last name is required."), (0, express_validator_1.check)("phoneCode").notEmpty().withMessage("Your phone code is required."), (0, express_validator_1.check)("phoneNumber").notEmpty().withMessage("Your phone number is required."), (0, express_validator_1.check)("profession").notEmpty().withMessage("Your profession is required."), (0, express_validator_1.check)("userName").notEmpty().withMessage("Your username is required."), (0, express_validator_1.check)("dateOfBirth")
    .notEmpty()
    .withMessage("Your date of birth is required."), (0, express_validator_1.check)("address").notEmpty().withMessage("Your address is required."), (0, express_validator_1.check)("country").notEmpty().withMessage("Your country is required."), validate_middlewares_1.default, auth_middlewares_1.default, user_middlewares_1.default, user_controllers_1.updateProfile);
router.put("/remove-avatar", auth_middlewares_1.default, user_middlewares_1.default, user_controllers_1.removeAvatar);
router.patch("/update-avatar", auth_middlewares_1.default, user_middlewares_1.default, file_1.imageUpload.single("avatar"), user_controllers_1.updateAvatar);
router.patch("/delete-users", (0, express_validator_1.check)("password").notEmpty().withMessage("Your password is required."), (0, express_validator_1.check)("reason").notEmpty().withMessage("Your reason is required."), (0, express_validator_1.check)("description").notEmpty().withMessage("Your description is required."), validate_middlewares_1.default, auth_middlewares_1.default, user_middlewares_1.default, user_controllers_1.deleteUsers);
router.patch("/review-users", (0, express_validator_1.check)("id").notEmpty().withMessage("ID is required."), (0, express_validator_1.check)("status").notEmpty().withMessage("Status is required."), validate_middlewares_1.default, auth_middlewares_1.default, admin_middlewares_1.default, user_controllers_1.reviewUsers);
router.get("/file/:name", user_controllers_1.getUserAvatar);
exports.default = router;
