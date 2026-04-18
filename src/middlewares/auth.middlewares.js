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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const blackListToken_models_1 = __importDefault(require("../models/blackListToken.models"));
const error_services_1 = require("../services/error.services");
const isAuth = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = request.header("Authorization")
            ? (_a = request.header("Authorization")) === null || _a === void 0 ? void 0 : _a.split(" ")[1]
            : null;
        if (!token) {
            const error = new Error("Please login to continue.");
            error.statusCode = 401;
            return next(error);
        }
        const checkIfBlacklisted = yield blackListToken_models_1.default.findOne({
            where: { token },
        });
        if (checkIfBlacklisted) {
            const error = new Error("This session has expired. Please login");
            error.statusCode = 401;
            return next(error);
        }
        const decodedToken = (jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET));
        if (!decodedToken) {
            const error = new Error("You are not authorized to view this page.");
            error.statusCode = 401;
            return next(error);
        }
        request.user = decodedToken;
        next();
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.default = isAuth;
