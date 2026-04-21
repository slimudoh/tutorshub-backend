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
exports.deleteMessage = exports.markMessageAsRead = exports.getMessages = void 0;
const error_services_1 = require("../services/error.services");
const message_services_1 = require("../services/message.services");
const auditLog_services_1 = require("../services/auditLog.services");
const user_services_1 = require("../services/user.services");
const getMessages = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const messages = yield (0, message_services_1.getUserMessages)(userId, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, message_services_1.getUserMessages)(userId, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: messages,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getMessages = getMessages;
const markMessageAsRead = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id } = request.params;
        console.log({ id });
        const message = yield (0, message_services_1.findMessageById)(id);
        if (!message) {
            return response.status(404).json({
                message: "Message not found",
            });
        }
        if (message.receiverId !== userId) {
            return response.status(403).json({
                message: "You are not authorized to perform this action",
            });
        }
        yield (0, message_services_1.markUserMessageAsRead)(id);
        const updatedMessage = yield (0, message_services_1.findMessageById)(id);
        const user = yield (0, user_services_1.findUserById)(userId);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "MARK MESSAGE AS READ",
            oldData: JSON.stringify(message),
            newData: JSON.stringify(updatedMessage),
            section: "MESSAGE",
        });
        response.status(200).json({
            message: "Message marked as read successfully",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.markMessageAsRead = markMessageAsRead;
const deleteMessage = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id } = request.params;
        const message = yield (0, message_services_1.findMessageById)(id);
        if (!message) {
            return response.status(404).json({
                message: "Message not found",
            });
        }
        if (message.receiverId !== userId) {
            return response.status(403).json({
                message: "You are not authorized to perform this action",
            });
        }
        yield (0, message_services_1.deleteUserMessage)(id);
        const user = yield (0, user_services_1.findUserById)(userId);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "DELETE MESSAGE",
            newData: JSON.stringify(message),
            section: "MESSAGE",
        });
        response.status(200).json({
            message: "Message deleted successfully",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.deleteMessage = deleteMessage;
