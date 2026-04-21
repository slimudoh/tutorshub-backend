"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const admin_middlewares_1 = __importDefault(require("../middlewares/admin.middlewares"));
const auditLog_controllers_1 = require("../controllers/auditLog.controllers");
const router = (0, express_1.Router)();
router.get("/", auth_middlewares_1.default, admin_middlewares_1.default, auditLog_controllers_1.getAllAuditLogs);
exports.default = router;
