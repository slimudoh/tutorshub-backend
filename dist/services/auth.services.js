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
exports.generateEmailToken = exports.generateAuthToken = exports.createBlackListToken = exports.findExpiredTokenById = void 0;
const crypto_1 = __importDefault(require("crypto"));
const blackListToken_models_1 = __importDefault(require("../models/blackListToken.models"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constant_1 = require("../utils/constant");
const findExpiredTokenById = (token) => __awaiter(void 0, void 0, void 0, function* () {
    return yield blackListToken_models_1.default.findOne({
        where: { token },
    });
});
exports.findExpiredTokenById = findExpiredTokenById;
const createBlackListToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    return yield blackListToken_models_1.default.create({
        id: crypto_1.default.randomUUID(),
        token,
    });
});
exports.createBlackListToken = createBlackListToken;
const generateAuthToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        role: user.role,
    }, process.env.TOKEN_SECRET);
    return token;
});
exports.generateAuthToken = generateAuthToken;
const generateEmailToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const token = Math.floor(Math.random() * 900000) + 100000;
    user.token = token.toString();
    user.tokenExpiry = new Date();
    user.tokenExpiryStatus = constant_1.STATUS.ACTIVE;
    yield user.save();
    return user;
});
exports.generateEmailToken = generateEmailToken;
