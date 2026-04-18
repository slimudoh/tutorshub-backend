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
exports.getSubscribers = exports.getAdminSubscribers = void 0;
const sequelize_1 = require("sequelize");
const subscriber_models_1 = __importDefault(require("../models/subscriber.models"));
const constant_1 = require("../utils/constant");
const getAdminSubscribers = (keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [{ title: { [sequelize_1.Op.like]: `%${keyword}%` } }],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    if (!offsetSize && !newPageSize) {
        return yield subscriber_models_1.default.count({ where: Object.assign({}, where) });
    }
    return yield subscriber_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign({}, where), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.SUBSCRIBER_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getAdminSubscribers = getAdminSubscribers;
const getSubscribers = (userId_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [userId_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (userId, keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [{ title: { [sequelize_1.Op.like]: `%${keyword}%` } }],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    if (!offsetSize && !newPageSize) {
        return yield subscriber_models_1.default.count({ where: Object.assign(Object.assign({}, where), { userId }) });
    }
    return yield subscriber_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign({}, where), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.SUBSCRIBER_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getSubscribers = getSubscribers;
