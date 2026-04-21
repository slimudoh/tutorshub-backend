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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excludeFields = exports.getAuditLogs = exports.createAuditLog = void 0;
const auditLog_models_1 = __importDefault(require("../models/auditLog.models"));
const crypto_1 = __importDefault(require("crypto"));
const createAuditLog = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, action, oldData, newData, section } = payload;
    console.log({ user });
    yield auditLog_models_1.default.create({
        id: crypto_1.default.randomUUID(),
        user: user ? (0, exports.excludeFields)(user) : null,
        action,
        oldData: oldData ? (0, exports.excludeFields)(oldData) : null,
        newData: newData ? (0, exports.excludeFields)(newData) : null,
        section,
    });
});
exports.createAuditLog = createAuditLog;
const getAuditLogs = (offsetSize, newPageSize) => __awaiter(void 0, void 0, void 0, function* () {
    const auditLogs = yield auditLog_models_1.default.findAll(Object.assign(Object.assign(Object.assign({}, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), { order: [["createdAt", "DESC"]], raw: true }));
    if (!offsetSize && !newPageSize) {
        return yield auditLog_models_1.default.count();
    }
    return auditLogs;
});
exports.getAuditLogs = getAuditLogs;
const excludeFields = (data) => {
    const parsedData = JSON.parse(data);
    const { password, createdAt, updatedAt, emailVerified, emailVerifiedAt, token, tokenExpiry, tokenExpiryStatus } = parsedData, rest = __rest(parsedData, ["password", "createdAt", "updatedAt", "emailVerified", "emailVerifiedAt", "token", "tokenExpiry", "tokenExpiryStatus"]);
    return JSON.stringify(rest);
};
exports.excludeFields = excludeFields;
