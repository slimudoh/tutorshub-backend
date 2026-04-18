"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const message_controllers_1 = require("../controllers/message.controllers");
const router = (0, express_1.Router)();
router.get("/", auth_middlewares_1.default, user_middlewares_1.default, message_controllers_1.getMessages);
router.put("/:id", auth_middlewares_1.default, user_middlewares_1.default, message_controllers_1.markMessageAsRead);
router.delete("/:id", auth_middlewares_1.default, user_middlewares_1.default, message_controllers_1.deleteMessage);
exports.default = router;
