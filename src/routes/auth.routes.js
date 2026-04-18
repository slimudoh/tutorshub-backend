"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controllers_1 = require("../controllers/auth.controllers");
const user_models_1 = __importDefault(require("../models/user.models"));
const express_validator_1 = require("express-validator");
const validate_middlewares_1 = __importDefault(require("../middlewares/validate.middlewares"));
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const router = (0, express_1.Router)();
router.post("/register", (0, express_validator_1.check)("firstName").notEmpty().withMessage("Your first name is required."), (0, express_validator_1.check)("lastName").notEmpty().withMessage("Your last name is required."), (0, express_validator_1.check)("phoneCode").notEmpty().withMessage("Your phone code is required."), (0, express_validator_1.check)("phoneNumber").notEmpty().withMessage("Your phone number is required."), (0, express_validator_1.check)("password")
    .notEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must not be less than 8 characters."), (0, express_validator_1.check)("emailAddress")
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid e-mail address.")
    .normalizeEmail()
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_models_1.default.findOne({
        where: { emailAddress: value },
        attributes: ["emailAddress"],
    });
    if (user) {
        throw new Error("Email address already taken.");
    }
})), validate_middlewares_1.default, auth_controllers_1.registerUser);
router.post("/login", (0, express_validator_1.check)("emailAddress")
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid e-mail address.")
    .normalizeEmail()
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_models_1.default.findOne({
        where: { emailAddress: value },
        attributes: ["emailAddress"],
    });
    if (!user) {
        throw new Error("Email address not found.");
    }
})), (0, express_validator_1.check)("password")
    .notEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must not be less than 8 characters."), validate_middlewares_1.default, auth_controllers_1.loginUser);
router.post("/verify-email", (0, express_validator_1.check)("id")
    .notEmpty()
    .withMessage("Something went wrong. Please try again later."), (0, express_validator_1.check)("token").notEmpty().withMessage("Token is required."), validate_middlewares_1.default, auth_controllers_1.verifyEmail);
router.post("/forgot-password", (0, express_validator_1.check)("emailAddress")
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid e-mail address.")
    .normalizeEmail()
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_models_1.default.findOne({
        where: { emailAddress: value },
        attributes: ["emailAddress"],
    });
    if (!user) {
        throw new Error("Email address not found.");
    }
})), validate_middlewares_1.default, auth_controllers_1.forgotPassword);
router.post("/reset-password", (0, express_validator_1.check)("id")
    .notEmpty()
    .withMessage("Something went wrong. Please try again later."), (0, express_validator_1.check)("token").notEmpty().withMessage("Token is required."), (0, express_validator_1.check)("password")
    .notEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must not be less than 8 characters."), validate_middlewares_1.default, auth_controllers_1.resetPassword);
router.get("/resend-token/:id", auth_controllers_1.resendToken);
router.get("/logout", auth_middlewares_1.default, auth_controllers_1.logoutUser);
exports.default = router;
