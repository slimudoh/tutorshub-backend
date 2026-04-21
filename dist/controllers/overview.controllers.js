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
exports.getOverview = void 0;
const user_services_1 = require("../services/user.services");
const error_services_1 = require("../services/error.services");
const overview_services_1 = require("../services/overview.services");
const getOverview = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield (0, user_services_1.findUserById)(userId);
        let overviewData = {
            // admin
            totalUsers: 0,
            totalActiveUsers: 0,
            totalPendingUsers: 0,
            totalSuspendedUsers: 0,
            totalDeactivatedUsers: 0,
            totalActiveCurrencies: 0,
            totalLessons: 0,
            totalActiveLessons: 0,
            totalPendingLessons: 0,
            totalSuspendedLessons: 0,
            totalDeactivatedLessons: 0,
            totalEarnings: 0,
            totalPayouts: 0,
            totalPayments: 0,
            totalSubscribers: 0,
            totalReviews: 0,
            // user
            lesson: 0,
            activeLessons: 0,
            pendingLessons: 0,
            suspendedLessons: 0,
            deactivatedLessons: 0,
            earnings: 0,
            payouts: 0,
            payments: 0,
            subscribers: 0,
            reviews: 0,
        };
        if ((user === null || user === void 0 ? void 0 : user.role) === "ADMIN" || (user === null || user === void 0 ? void 0 : user.role) === "SUPER_ADMIN") {
            const adminOverviewData = yield (0, overview_services_1.getAdminOverviewData)();
            overviewData = Object.assign(Object.assign({}, overviewData), adminOverviewData);
        }
        const userOverviewData = yield (0, overview_services_1.getUserOverviewData)(userId);
        overviewData = Object.assign(Object.assign({}, overviewData), userOverviewData);
        response.status(201).json({
            data: overviewData,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getOverview = getOverview;
