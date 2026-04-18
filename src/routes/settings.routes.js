"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const settings_controllers_1 = require("../controllers/settings.controllers");
const validate_middlewares_1 = __importDefault(require("../middlewares/validate.middlewares"));
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
router.get("/", auth_middlewares_1.default, user_middlewares_1.default, settings_controllers_1.getUserSettings);
router.patch("/notifications", auth_middlewares_1.default, user_middlewares_1.default, (0, express_validator_1.check)("notification")
    .notEmpty()
    .withMessage("Your notification settings is required."), validate_middlewares_1.default, settings_controllers_1.updateNotificationSettings);
exports.default = router;
