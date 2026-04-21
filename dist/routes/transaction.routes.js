"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const admin_middlewares_1 = __importDefault(require("../middlewares/admin.middlewares"));
const transaction_controllers_1 = require("../controllers/transaction.controllers");
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const router = (0, express_1.Router)();
router.get("/admin-earnings", auth_middlewares_1.default, admin_middlewares_1.default, transaction_controllers_1.getAdminEarnings);
router.get("/admin-payouts", auth_middlewares_1.default, admin_middlewares_1.default, transaction_controllers_1.getAdminPayouts);
router.get("/admin-payments", auth_middlewares_1.default, admin_middlewares_1.default, transaction_controllers_1.getAdminPayments);
router.get("/user-earnings", auth_middlewares_1.default, user_middlewares_1.default, transaction_controllers_1.getUserEarnings);
router.get("/user-payouts", auth_middlewares_1.default, user_middlewares_1.default, transaction_controllers_1.getUserPayouts);
router.get("/user-payments", auth_middlewares_1.default, user_middlewares_1.default, transaction_controllers_1.getUserPayments);
exports.default = router;
