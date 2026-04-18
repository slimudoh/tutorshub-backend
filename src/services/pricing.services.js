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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdminPricingPlans = exports.updatePricingPlanStatus = exports.findPricingPlanById = exports.findUsersSubscriptionPlans = exports.findAllPricingPlans = void 0;
const core_1 = require("@sequelize/core");
const pricingPlan_models_1 = __importDefault(require("../models/pricingPlan.models"));
const subscriptionPlan_models_1 = __importDefault(require("../models/subscriptionPlan.models"));
const constant_1 = require("../utils/constant");
const findAllPricingPlans = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield pricingPlan_models_1.default.findAll({
        raw: true,
    });
});
exports.findAllPricingPlans = findAllPricingPlans;
const findUsersSubscriptionPlans = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscriptionPlan_models_1.default.findAll({
        where: {
            userId,
        },
        raw: true,
    });
});
exports.findUsersSubscriptionPlans = findUsersSubscriptionPlans;
const findPricingPlanById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield pricingPlan_models_1.default.findOne({
        where: {
            id,
        },
        raw: true,
    });
});
exports.findPricingPlanById = findPricingPlanById;
const updatePricingPlanStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield pricingPlan_models_1.default.update({
        status,
    }, {
        where: {
            id,
        },
    });
});
exports.updatePricingPlanStatus = updatePricingPlanStatus;
const fetchAdminPricingPlans = (keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [core_1.Op.or]: [
                { name: { [core_1.Op.like]: `%${keyword}%` } },
                { description: { [core_1.Op.like]: `%${keyword}%` } },
            ],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    if (!offsetSize && !newPageSize) {
        return yield pricingPlan_models_1.default.count({ where: Object.assign({}, where) });
    }
    return yield pricingPlan_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign({}, where), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.PRICING_PLAN_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.fetchAdminPricingPlans = fetchAdminPricingPlans;
