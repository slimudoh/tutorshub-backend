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
exports.getUserPayouts = exports.getUserEarnings = exports.getUserPayments = exports.getAdminPayments = exports.getAdminPayouts = exports.getAdminEarnings = void 0;
const error_services_1 = require("../services/error.services");
const transaction_services_1 = require("../services/transaction.services");
const constant_1 = require("../utils/constant");
const getAdminEarnings = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const transactions = yield (0, transaction_services_1.getAdminTransactions)(constant_1.TRANSACTION_TYPE.EARNING, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, transaction_services_1.getAdminTransactions)(constant_1.TRANSACTION_TYPE.EARNING, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: transactions,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAdminEarnings = getAdminEarnings;
const getAdminPayouts = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const transactions = yield (0, transaction_services_1.getAdminTransactions)(constant_1.TRANSACTION_TYPE.PAYOUT, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, transaction_services_1.getAdminTransactions)(constant_1.TRANSACTION_TYPE.PAYOUT, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: transactions,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAdminPayouts = getAdminPayouts;
const getAdminPayments = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const transactions = yield (0, transaction_services_1.getAdminTransactions)(constant_1.TRANSACTION_TYPE.PAYMENT, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, transaction_services_1.getAdminTransactions)(constant_1.TRANSACTION_TYPE.PAYMENT, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: transactions,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAdminPayments = getAdminPayments;
const getUserPayments = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const transactions = yield (0, transaction_services_1.getUserTransactions)(userId, constant_1.TRANSACTION_TYPE.PAYMENT, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, transaction_services_1.getUserTransactions)(userId, constant_1.TRANSACTION_TYPE.PAYMENT, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: transactions,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getUserPayments = getUserPayments;
const getUserEarnings = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const transactions = yield (0, transaction_services_1.getUserTransactions)(userId, constant_1.TRANSACTION_TYPE.EARNING, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, transaction_services_1.getUserTransactions)(userId, constant_1.TRANSACTION_TYPE.EARNING, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: transactions,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getUserEarnings = getUserEarnings;
const getUserPayouts = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const transactions = yield (0, transaction_services_1.getUserTransactions)(userId, constant_1.TRANSACTION_TYPE.PAYOUT, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, transaction_services_1.getUserTransactions)(userId, constant_1.TRANSACTION_TYPE.PAYOUT, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: transactions,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getUserPayouts = getUserPayouts;
