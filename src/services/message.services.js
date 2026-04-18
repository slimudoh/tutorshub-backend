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
exports.deleteUserMessage = exports.markUserMessageAsRead = exports.createMessage = exports.getUserMessages = exports.findMessageById = void 0;
const sequelize_1 = require("sequelize");
const constant_1 = require("../utils/constant");
const message_models_1 = __importDefault(require("../models/message.models"));
// settings.newLesson = notification.newLesson;
// settings.lessonNotSubscribed = notification.lessonNotSubscribed;
// settings.lessonSubscribed1Day = notification.lessonSubscribed1Day;
// settings.lessonSubscribed1Hour = notification.lessonSubscribed1Hour;
// settings.lessonSubscribed30Minutes = notification.lessonSubscribed30Minutes;
// settings.lessonSubscribed15Minutes = notification.lessonSubscribed15Minutes;
// settings.lessonSubscribed5Minutes = notification.lessonSubscribed5Minutes;
// settings.newMessage = notification.newMessage;
// settings.lessonComplete = notification.lessonComplete;
// settings.weeklySummary = notification.weeklySummary;
// settings.monthlySummary = notification.monthlySummary;
const findMessageById = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, excludeAttributes = true) {
    return yield message_models_1.default.findOne(Object.assign(Object.assign({ where: {
            id: id,
        } }, (excludeAttributes && {
        attributes: {
            exclude: constant_1.MESSAGE_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.findMessageById = findMessageById;
const getUserMessages = (userId_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [userId_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (userId, keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [{ title: { [sequelize_1.Op.like]: `%${keyword}%` } }],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { isRead: status === "READ" });
    }
    if (!offsetSize && !newPageSize) {
        return yield message_models_1.default.count({
            where: Object.assign({ receiverId: userId, isDeleted: false }, where),
        });
    }
    return yield message_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign({ receiverId: userId, isDeleted: false }, where), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.MESSAGE_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getUserMessages = getUserMessages;
const createMessage = (title_1, message_1, receiverId_1, ...args_1) => __awaiter(void 0, [title_1, message_1, receiverId_1, ...args_1], void 0, function* (title, message, receiverId, senderId = null) {
    return yield message_models_1.default.create({
        id: crypto.randomUUID(),
        senderId,
        receiverId,
        title,
        message,
        isDelivered: true,
        deliveredAt: new Date(),
    });
});
exports.createMessage = createMessage;
const markUserMessageAsRead = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield message_models_1.default.update({
        isRead: true,
        readAt: new Date(),
    }, {
        where: {
            id: id,
            isRead: false,
        },
    });
});
exports.markUserMessageAsRead = markUserMessageAsRead;
const deleteUserMessage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield message_models_1.default.update({
        isDeleted: true,
        deletedAt: new Date(),
    }, {
        where: {
            id: id,
        },
    });
});
exports.deleteUserMessage = deleteUserMessage;
