"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const review_controllers_1 = require("../controllers/review.controllers");
const admin_middlewares_1 = __importDefault(require("../middlewares/admin.middlewares"));
const router = (0, express_1.Router)();
router.get("/user-reviews", auth_middlewares_1.default, user_middlewares_1.default, review_controllers_1.getUserReviews);
router.get("/admin-reviews", auth_middlewares_1.default, admin_middlewares_1.default, review_controllers_1.getAdminReviews);
exports.default = router;
