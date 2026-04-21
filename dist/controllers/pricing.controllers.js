"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewAdminPricingPlan = exports.getAdminPricingPlans = exports.getSubscriptionPlans = exports.getPricingPlans = void 0;
const error_services_1 = require("../services/error.services");
const pricing_services_1 = require("../services/pricing.services");
const constant_1 = require("../utils/constant");
const user_services_1 = require("../services/user.services");
const auditLog_services_1 = require("../services/auditLog.services");
const getPricingPlans = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pricingPlans = yield (0, pricing_services_1.findAllPricingPlans)();
        response.status(201).json({
            data: pricingPlans,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getPricingPlans = getPricingPlans;
const getSubscriptionPlans = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const subscriptionPlans = yield (0, pricing_services_1.findUsersSubscriptionPlans)(userId);
        response.status(201).json({
            data: subscriptionPlans,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getSubscriptionPlans = getSubscriptionPlans;
const getAdminPricingPlans = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const pricingPlans = yield (0, pricing_services_1.fetchAdminPricingPlans)(keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, pricing_services_1.fetchAdminPricingPlans)(keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: pricingPlans,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAdminPricingPlans = getAdminPricingPlans;
const reviewAdminPricingPlan = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id, status } = request.body;
        const plan = yield (0, pricing_services_1.findPricingPlanById)(id);
        if (!plan) {
            const error = new Error("Plan not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        if (status !== constant_1.STATUS.ACTIVATE && status !== constant_1.STATUS.SUSPEND) {
            const error = new Error("Invalid status. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        if (status === constant_1.STATUS.PENDING) {
            const error = new Error("Plan is in PENDING status. You cannot review a pending pricing plan.");
            error.statusCode = 400;
            return next(error);
        }
        if (plan.status === status) {
            const error = new Error("Plan is already in the selected status. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        const newStatus = status === constant_1.STATUS.ACTIVATE ? constant_1.STATUS.ACTIVE : constant_1.STATUS.SUSPENDED;
        yield (0, pricing_services_1.updatePricingPlanStatus)(id, newStatus);
        const targetUser = yield (0, user_services_1.findUserById)(userId);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(targetUser),
            action: newStatus,
            oldData: JSON.stringify(plan),
            newData: JSON.stringify(Object.assign(Object.assign({}, plan), { status: newStatus })),
            section: "REVIEW PRICING PLAN",
        });
        response.status(201).json({
            message: "Plan reviewed successfully.",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.reviewAdminPricingPlan = reviewAdminPricingPlan;
