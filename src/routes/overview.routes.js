"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const overview_controllers_1 = require("../controllers/overview.controllers");
const router = (0, express_1.Router)();
router.get("/", auth_middlewares_1.default, user_middlewares_1.default, overview_controllers_1.getOverview);
exports.default = router;
