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
const user_models_1 = __importDefault(require("../models/user.models"));
const constant_1 = require("../utils/constant");
const user_services_1 = require("../services/user.services");
const error_services_1 = require("../services/error.services");
const isAdmin = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = request.user;
        const authUser = yield user_models_1.default.findOne({
            where: { id: user.id },
            attributes: { exclude: ["password"] },
        });
        if (!(authUser === null || authUser === void 0 ? void 0 : authUser.role)) {
            const error = new Error("You are not authorized to view this page.");
            error.statusCode = 401;
            return next(error);
        }
        if (authUser.role !== constant_1.ROLES.ADMIN && user.role !== constant_1.ROLES.SUPER_ADMIN) {
            const error = new Error("You are not authorized to view this page.");
            error.statusCode = 401;
            return next(error);
        }
        const accountStatus = yield (0, user_services_1.checkUserAccountStatus)(authUser.status);
        if (accountStatus.status !== 200) {
            const error = new Error(accountStatus.message);
            error.statusCode = accountStatus.status;
            return next(error);
        }
        const emailVerificationStatus = yield (0, user_services_1.checkUserEmailVerificationStatus)(authUser.emailVerified);
        if (emailVerificationStatus.status !== 200) {
            const error = new Error(emailVerificationStatus.message);
            error.statusCode = emailVerificationStatus.status;
            return next(error);
        }
        next();
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.default = isAdmin;
