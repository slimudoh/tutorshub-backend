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
exports.getUserOverviewData = exports.getAdminOverviewData = void 0;
const lesson_models_1 = __importDefault(require("../models/lesson.models"));
const transaction_models_1 = __importDefault(require("../models/transaction.models"));
const user_models_1 = __importDefault(require("../models/user.models"));
const constant_1 = require("../utils/constant");
const currency_models_1 = __importDefault(require("../models/currency.models"));
const subscriber_models_1 = __importDefault(require("../models/subscriber.models"));
const review_models_1 = __importDefault(require("../models/review.models"));
const getAdminOverviewData = () => __awaiter(void 0, void 0, void 0, function* () {
    const totalTransactions = yield transaction_models_1.default.findAll();
    const totalSubscribers = yield subscriber_models_1.default.count();
    const totalReviews = yield review_models_1.default.count();
    const totalActiveCurrencies = yield currency_models_1.default.count({
        where: {
            status: constant_1.STATUS.ACTIVE,
        },
    });
    const totalUsers = yield user_models_1.default.findAll();
    const totalActiveUsers = totalUsers.filter((user) => user.status === constant_1.STATUS.ACTIVE).length;
    const totalPendingUsers = totalUsers.filter((user) => user.status === constant_1.STATUS.PENDING).length;
    const totalSuspendedUsers = totalUsers.filter((user) => user.status === constant_1.STATUS.SUSPENDED).length;
    const totalDeactivatedUsers = totalUsers.filter((user) => user.status === constant_1.STATUS.DEACTIVATED).length;
    const totalLessons = yield lesson_models_1.default.findAll();
    const totalActiveLessons = totalLessons.filter((lesson) => lesson.status === constant_1.STATUS.ACTIVE).length;
    const totalPendingLessons = totalLessons.filter((lesson) => lesson.status === constant_1.STATUS.PENDING).length;
    const totalSuspendedLessons = totalLessons.filter((lesson) => lesson.status === constant_1.STATUS.SUSPENDED).length;
    const totalDeactivatedLessons = totalLessons.filter((lesson) => lesson.status === constant_1.STATUS.DEACTIVATED).length;
    return {
        totalUsers: totalUsers.length,
        totalActiveUsers,
        totalPendingUsers,
        totalSuspendedUsers,
        totalDeactivatedUsers,
        totalLessons: totalLessons.length,
        totalActiveLessons,
        totalPendingLessons,
        totalSuspendedLessons,
        totalDeactivatedLessons,
        totalActiveCurrencies,
        totalEarnings: totalTransactions.filter((transaction) => transaction.transactionType === constant_1.TRANSACTION_TYPE.EARNING).length,
        totalPayouts: totalTransactions.filter((transaction) => transaction.transactionType === constant_1.TRANSACTION_TYPE.PAYOUT).length,
        totalPayments: totalTransactions.filter((transaction) => transaction.transactionType === constant_1.TRANSACTION_TYPE.PAYMENT).length,
        totalSubscribers,
        totalReviews,
    };
});
exports.getAdminOverviewData = getAdminOverviewData;
const getUserOverviewData = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const transactions = yield transaction_models_1.default.findAll({
        where: {
            userId,
        },
    });
    const lesson = yield lesson_models_1.default.findAll({
        where: {
            userId,
        },
    });
    const subscribers = yield subscriber_models_1.default.count({
        where: {
            userId,
        },
    });
    const reviews = yield review_models_1.default.count({
        where: {
            userId,
        },
    });
    return {
        lesson: lesson.length,
        activeLessons: lesson.filter((lesson) => lesson.status === constant_1.STATUS.ACTIVE)
            .length,
        pendingLessons: lesson.filter((lesson) => lesson.status === constant_1.STATUS.PENDING)
            .length,
        suspendedLessons: lesson.filter((lesson) => lesson.status === constant_1.STATUS.SUSPENDED).length,
        deactivatedLessons: lesson.filter((lesson) => lesson.status === constant_1.STATUS.DEACTIVATED).length,
        earnings: transactions.filter((transactions) => transactions.transactionType === constant_1.TRANSACTION_TYPE.EARNING).length,
        payouts: transactions.filter((transactions) => transactions.transactionType === constant_1.TRANSACTION_TYPE.PAYOUT).length,
        payments: transactions.filter((transactions) => transactions.transactionType === constant_1.TRANSACTION_TYPE.PAYMENT).length,
        subscribers,
        reviews,
    };
});
exports.getUserOverviewData = getUserOverviewData;
