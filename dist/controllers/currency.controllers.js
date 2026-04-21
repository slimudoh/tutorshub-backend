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
exports.updateCurrencies = exports.reviewCurrencies = exports.getNewCurrencyRates = exports.getAllActiveCurrencies = exports.getCurrencyDetails = exports.getCurrencies = void 0;
const currency_services_1 = require("../services/currency.services");
const error_services_1 = require("../services/error.services");
const constant_1 = require("../utils/constant");
const auditLog_services_1 = require("../services/auditLog.services");
const user_services_1 = require("../services/user.services");
const getCurrencies = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, status } = request.query;
        const currencies = yield (0, currency_services_1.fetchAllCurrencies)(keyword, status);
        response.status(201).json({
            data: currencies,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getCurrencies = getCurrencies;
const getCurrencyDetails = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        if (!((_a = request.params) === null || _a === void 0 ? void 0 : _a.id)) {
            const error = new Error("Currency ID is not found. Please try again later");
            error.statusCode = 404;
            return next(error);
        }
        const currency = yield (0, currency_services_1.findCurrencyById)((_b = request.params) === null || _b === void 0 ? void 0 : _b.id);
        if ((currency === null || currency === void 0 ? void 0 : currency.status) !== constant_1.STATUS.ACTIVE) {
            const error = new Error("Currency is not active. Please try again later");
            error.statusCode = 404;
            return next(error);
        }
        const rates = yield (0, currency_services_1.findRateByFromCurrency)((_c = currency === null || currency === void 0 ? void 0 : currency.symbol) !== null && _c !== void 0 ? _c : "");
        response.status(201).json({
            data: {
                rates,
                currency,
            },
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getCurrencyDetails = getCurrencyDetails;
const getAllActiveCurrencies = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let currencies = yield (0, currency_services_1.findAllActiveCurrencies)();
        response.status(201).json({
            data: currencies,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAllActiveCurrencies = getAllActiveCurrencies;
const getNewCurrencyRates = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let result = yield (0, currency_services_1.fetchNewRates)();
        if (!result.success) {
            const error = new Error(result.message);
            error.statusCode = 500;
            return next(error);
        }
        const rates = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.rates;
        if (!rates) {
            const error = new Error("Rates not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        //add new rate ================================================
        // addAllCurrencies(rates);
        //update new rate ================================================
        (0, currency_services_1.updateAllCurrencies)(rates);
        (0, currency_services_1.updateCurrenciesList)();
        response.status(201).json({
            message: "Rates updated successfully.",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getNewCurrencyRates = getNewCurrencyRates;
const reviewCurrencies = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, status } = request.body;
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const currency = yield (0, currency_services_1.findCurrencyById)(id);
        if (!currency) {
            const error = new Error("Currency not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        if (status !== constant_1.STATUS.ACTIVATE && status !== constant_1.STATUS.SUSPEND) {
            const error = new Error("Invalid status. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        if (status === constant_1.STATUS.PENDING) {
            const error = new Error("Currency is in PENDING status. You cannot review a pending currency.");
            error.statusCode = 400;
            return next(error);
        }
        if (currency.status === status) {
            const error = new Error("Currency is already in the selected status. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        if (!currency.country || !currency.currency) {
            const error = new Error("Currency has not been updated. Please update the currency before reviewing.");
            error.statusCode = 400;
            return next(error);
        }
        const newStatus = status === constant_1.STATUS.ACTIVATE ? constant_1.STATUS.ACTIVE : constant_1.STATUS.SUSPENDED;
        yield (0, currency_services_1.updateCurrencyStatus)(id, newStatus);
        const user = yield (0, user_services_1.findUserById)(userId);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: newStatus,
            oldData: JSON.stringify(currency),
            newData: JSON.stringify(Object.assign(Object.assign({}, currency), { status: newStatus })),
            section: "REVIEW CURRENCY",
        });
        response.status(201).json({
            message: "Currency reviewed successfully.",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.reviewCurrencies = reviewCurrencies;
const updateCurrencies = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, country, currency } = request.body;
        yield (0, currency_services_1.updateCurrency)(country, currency, id);
        response.status(201).json({
            message: "Currency added successfully.",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.updateCurrencies = updateCurrencies;
