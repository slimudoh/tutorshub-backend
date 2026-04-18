"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_middlewares_1 = __importDefault(require("../middlewares/admin.middlewares"));
const auth_middlewares_1 = __importDefault(require("../middlewares/auth.middlewares"));
const currency_controllers_1 = require("../controllers/currency.controllers");
const express_validator_1 = require("express-validator");
const validate_middlewares_1 = __importDefault(require("../middlewares/validate.middlewares"));
const router = (0, express_1.Router)();
router.get("/", auth_middlewares_1.default, admin_middlewares_1.default, currency_controllers_1.getCurrencies);
router.get("/active-currencies", auth_middlewares_1.default, admin_middlewares_1.default, currency_controllers_1.getAllActiveCurrencies);
router.get("/update-all-currencies", currency_controllers_1.getNewCurrencyRates);
router.patch("/review-currencies", (0, express_validator_1.check)("id").notEmpty().withMessage("ID is required."), (0, express_validator_1.check)("status").notEmpty().withMessage("Status is required."), validate_middlewares_1.default, auth_middlewares_1.default, admin_middlewares_1.default, currency_controllers_1.reviewCurrencies);
router.patch("/update-currencies", (0, express_validator_1.check)("id").notEmpty().withMessage("ID is required."), (0, express_validator_1.check)("country").notEmpty().withMessage("Country is required."), (0, express_validator_1.check)("currency").notEmpty().withMessage("Currency is required."), validate_middlewares_1.default, auth_middlewares_1.default, admin_middlewares_1.default, currency_controllers_1.updateCurrencies);
router.get("/:id", auth_middlewares_1.default, admin_middlewares_1.default, currency_controllers_1.getCurrencyDetails);
exports.default = router;
