"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const admin_middlewares_1 = __importDefault(require("../middlewares/admin.middlewares"));
const subscriber_controllers_1 = require("../controllers/subscriber.controllers");
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const router = (0, express_1.Router)();
router.get("/admin-subscribers", auth_middlewares_1.default, admin_middlewares_1.default, subscriber_controllers_1.getAllSubcribers);
router.get("/user-subscribers", auth_middlewares_1.default, user_middlewares_1.default, subscriber_controllers_1.getUserSubcribers);
exports.default = router;
