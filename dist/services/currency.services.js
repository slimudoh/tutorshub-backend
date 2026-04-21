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
exports.updateCurrency = exports.updateCurrencyStatus = exports.getCurrencyData = exports.updateCurrenciesList = exports.updateAllCurrencies = exports.addAllCurrencies = exports.fetchNewRates = exports.fetchRate = exports.findRateByFromCurrency = exports.findCurrencyById = exports.findAllActiveCurrencies = exports.fetchAllCurrencies = void 0;
const core_1 = require("@sequelize/core");
const currency_models_1 = __importDefault(require("../models/currency.models"));
const constant_1 = require("../utils/constant");
const Rate_models_1 = __importDefault(require("../models/Rate.models"));
const fetchAllCurrencies = (keyword, status) => __awaiter(void 0, void 0, void 0, function* () {
    let where = {};
    if (keyword) {
        where = {
            [core_1.Op.or]: [
                { country: { [core_1.Op.like]: `%${keyword}%` } },
                { currency: { [core_1.Op.like]: `%${keyword}%` } },
                { symbol: { [core_1.Op.like]: `%${keyword}%` } },
            ],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    return yield currency_models_1.default.findAll({
        where: Object.assign({}, where),
        order: [["status", "ASC"]],
        raw: true,
    });
});
exports.fetchAllCurrencies = fetchAllCurrencies;
const findAllActiveCurrencies = () => __awaiter(void 0, void 0, void 0, function* () {
    let currencies = yield currency_models_1.default.findAll({
        where: { status: constant_1.STATUS.ACTIVE },
        order: [["status", "ASC"]],
        raw: true,
    });
    return currencies;
});
exports.findAllActiveCurrencies = findAllActiveCurrencies;
const findCurrencyById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield currency_models_1.default.findOne({
        where: {
            id: id,
        },
        raw: true,
    });
});
exports.findCurrencyById = findCurrencyById;
const findRateByFromCurrency = (currency) => __awaiter(void 0, void 0, void 0, function* () {
    const rates = yield Rate_models_1.default.findAll({
        where: {
            fromCurrency: currency,
        },
        raw: true,
    });
    return rates;
});
exports.findRateByFromCurrency = findRateByFromCurrency;
const fetchRate = (currency) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield fetch(`https://open.er-api.com/v6/latest/${currency || "USD"}`);
    return result;
});
exports.fetchRate = fetchRate;
const fetchNewRates = (currency) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield (0, exports.fetchRate)(currency || "USD");
    if (!result.ok) {
        return {
            success: false,
            message: `We cannot update ${currency || "USD"} rates at this time. Please try again later.`,
        };
    }
    result = yield result.json();
    if ((result === null || result === void 0 ? void 0 : result.result) !== "success") {
        return {
            success: false,
            message: `We cannot update ${currency || "USD"} rates at this time. Please try again later.`,
        };
    }
    return {
        success: true,
        data: result,
    };
});
exports.fetchNewRates = fetchNewRates;
const addAllCurrencies = (rates) => __awaiter(void 0, void 0, void 0, function* () {
    const newCurrencies = [];
    for (const [key, value] of Object.entries(rates)) {
        newCurrencies.push({
            id: crypto.randomUUID(),
            symbol: key,
            amount: value,
            status: constant_1.STATUS.SUSPENDED,
        });
    }
    yield currency_models_1.default.bulkCreate(newCurrencies);
});
exports.addAllCurrencies = addAllCurrencies;
const updateAllCurrencies = (rates) => __awaiter(void 0, void 0, void 0, function* () {
    const currencies = yield currency_models_1.default.findAll({
        raw: true,
    });
    let newCurrencies = [];
    for (const [key, value] of Object.entries(rates)) {
        for (const currency of currencies) {
            if (currency.symbol === key) {
                newCurrencies.push({
                    symbol: currency.symbol,
                    amount: value,
                });
            }
        }
    }
    if (newCurrencies.length > 0) {
        yield Promise.all(newCurrencies.map((currency) => {
            return currency_models_1.default.update({
                amount: currency.amount,
            }, {
                where: {
                    symbol: currency.symbol,
                },
            });
        }));
    }
});
exports.updateAllCurrencies = updateAllCurrencies;
const updateCurrenciesList = () => __awaiter(void 0, void 0, void 0, function* () {
    const currencies = yield currency_models_1.default.findAll({
        where: {
            status: constant_1.STATUS.ACTIVE,
        },
        raw: true,
    });
    for (const currency of currencies) {
        if (currency === null || currency === void 0 ? void 0 : currency.symbol) {
            const response = yield (0, exports.getCurrencyData)(currency.symbol);
            let newRates = [];
            for (const [key, value] of Object.entries(response)) {
                if (Number(value) > 0) {
                    newRates.push({
                        id: crypto.randomUUID(),
                        fromCurrency: currency.symbol,
                        toCurrency: key,
                        amount: value,
                        status: constant_1.STATUS.ACTIVE,
                    });
                }
            }
            if (newRates.length > 0) {
                yield Rate_models_1.default.destroy({
                    where: {
                        fromCurrency: currency.symbol,
                    },
                });
            }
            yield Rate_models_1.default.bulkCreate(newRates);
        }
    }
});
exports.updateCurrenciesList = updateCurrenciesList;
const getCurrencyData = (currency) => __awaiter(void 0, void 0, void 0, function* () {
    let response = yield (0, exports.fetchRate)(currency);
    if (response.ok) {
        response = yield response.json();
        if (response.result === "success") {
            return response.rates;
        }
    }
});
exports.getCurrencyData = getCurrencyData;
const updateCurrencyStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield currency_models_1.default.update({
        status,
    }, {
        where: {
            id,
        },
    });
});
exports.updateCurrencyStatus = updateCurrencyStatus;
const updateCurrency = (country, currency, id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield currency_models_1.default.update({
        country,
        currency,
        status: constant_1.STATUS.ACTIVE,
    }, {
        where: { id },
    });
});
exports.updateCurrency = updateCurrency;
