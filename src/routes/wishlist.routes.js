"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const wishlist_controllers_1 = require("../controllers/wishlist.controllers");
const router = (0, express_1.Router)();
router.get("/", auth_middlewares_1.default, user_middlewares_1.default, wishlist_controllers_1.getUserWishList);
exports.default = router;
