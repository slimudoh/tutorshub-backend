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
exports.getUserTransactions = exports.getAdminTransactions = void 0;
const sequelize_1 = require("sequelize");
const transaction_models_1 = __importDefault(require("../models/transaction.models"));
const constant_1 = require("../utils/constant");
const getAdminTransactions = (transactionType_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [transactionType_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (transactionType, keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [
                { currency: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { amount: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { reference: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { channel: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { transactionType,
            status });
    }
    if (!offsetSize && !newPageSize) {
        return yield transaction_models_1.default.count({ where });
    }
    return yield transaction_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where, order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.TRANSACTION_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getAdminTransactions = getAdminTransactions;
const getUserTransactions = (userId_1, transactionType_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [userId_1, transactionType_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (userId, transactionType, keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [
                { currency: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { amount: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { reference: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { channel: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    if (!offsetSize && !newPageSize) {
        return yield transaction_models_1.default.count({ where });
    }
    return yield transaction_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign(Object.assign({}, where), { transactionType,
            userId }), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.TRANSACTION_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getUserTransactions = getUserTransactions;
