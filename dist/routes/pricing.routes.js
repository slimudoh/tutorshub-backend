"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const user_middlewares_1 = __importDefault(require("../middlewares/user.middlewares"));
const pricing_controllers_1 = require("../controllers/pricing.controllers");
const admin_middlewares_1 = __importDefault(require("../middlewares/admin.middlewares"));
const express_validator_1 = require("express-validator");
const validate_middlewares_1 = __importDefault(require("../middlewares/validate.middlewares"));
const router = (0, express_1.Router)();
router.get("/", pricing_controllers_1.getPricingPlans);
router.get("/subscription-plans", auth_middlewares_1.default, user_middlewares_1.default, pricing_controllers_1.getSubscriptionPlans);
router.get("/admin-pricing-plans", auth_middlewares_1.default, admin_middlewares_1.default, pricing_controllers_1.getAdminPricingPlans);
router.patch("/review-admin-pricing-plans", (0, express_validator_1.check)("id").notEmpty().withMessage("ID is required."), (0, express_validator_1.check)("status").notEmpty().withMessage("Status is required."), validate_middlewares_1.default, auth_middlewares_1.default, admin_middlewares_1.default, pricing_controllers_1.reviewAdminPricingPlan);
exports.default = router;
