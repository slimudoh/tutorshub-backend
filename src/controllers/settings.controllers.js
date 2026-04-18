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
exports.updateNotificationSettings = exports.getUserSettings = void 0;
const error_services_1 = require("../services/error.services");
const setting_services_1 = require("../services/setting.services");
const auditLog_services_1 = require("../services/auditLog.services");
const user_services_1 = require("../services/user.services");
const getUserSettings = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const settings = yield (0, setting_services_1.getNotificationSettingsByUserId)(userId);
        response.status(201).json({
            data: {
                login: (settings === null || settings === void 0 ? void 0 : settings.login) || false,
                newLesson: (settings === null || settings === void 0 ? void 0 : settings.newLesson) || false,
                lessonNotSubscribed: (settings === null || settings === void 0 ? void 0 : settings.lessonNotSubscribed) || false,
                lessonSubscribed1Day: (settings === null || settings === void 0 ? void 0 : settings.lessonSubscribed1Day) || false,
                lessonSubscribed1Hour: (settings === null || settings === void 0 ? void 0 : settings.lessonSubscribed1Hour) || false,
                lessonSubscribed30Minutes: (settings === null || settings === void 0 ? void 0 : settings.lessonSubscribed30Minutes) || false,
                lessonSubscribed15Minutes: (settings === null || settings === void 0 ? void 0 : settings.lessonSubscribed15Minutes) || false,
                lessonSubscribed5Minutes: (settings === null || settings === void 0 ? void 0 : settings.lessonSubscribed5Minutes) || false,
                newMessage: (settings === null || settings === void 0 ? void 0 : settings.newMessage) || false,
                lessonComplete: (settings === null || settings === void 0 ? void 0 : settings.lessonComplete) || false,
                weeklySummary: (settings === null || settings === void 0 ? void 0 : settings.weeklySummary) || false,
                monthlySummary: (settings === null || settings === void 0 ? void 0 : settings.monthlySummary) || false,
            },
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getUserSettings = getUserSettings;
const updateNotificationSettings = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { notification } = request.body;
        const settings = yield (0, setting_services_1.getNotificationSettingsByUserId)(userId);
        const targetUser = yield (0, user_services_1.findUserById)(userId);
        let updatedSettings;
        if (settings) {
            yield (0, setting_services_1.updateNotificationSettingsByUserId)(userId, notification);
            updatedSettings = yield (0, setting_services_1.getNotificationSettingsByUserId)(userId);
            yield (0, auditLog_services_1.createAuditLog)({
                user: JSON.stringify(targetUser),
                action: "UPDATE NOTIFICATION SETTINGS",
                oldData: JSON.stringify(settings),
                newData: JSON.stringify(updatedSettings),
                section: "NOTIFICATION SETTINGS",
            });
        }
        else {
            yield (0, setting_services_1.createNotificationSettingsByUserId)(userId, notification);
            updatedSettings = yield (0, setting_services_1.getNotificationSettingsByUserId)(userId);
            yield (0, auditLog_services_1.createAuditLog)({
                user: JSON.stringify(targetUser),
                action: "CREATE NOTIFICATION SETTINGS",
                newData: JSON.stringify(updatedSettings),
                section: "NOTIFICATION SETTINGS",
            });
        }
        response.status(201).json({
            message: "Notification settings updated successfully",
            data: {
                login: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.login) || false,
                newLesson: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.newLesson) || false,
                lessonNotSubscribed: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.lessonNotSubscribed) || false,
                lessonSubscribed1Day: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.lessonSubscribed1Day) || false,
                lessonSubscribed1Hour: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.lessonSubscribed1Hour) || false,
                lessonSubscribed30Minutes: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.lessonSubscribed30Minutes) || false,
                lessonSubscribed15Minutes: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.lessonSubscribed15Minutes) || false,
                lessonSubscribed5Minutes: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.lessonSubscribed5Minutes) || false,
                newMessage: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.newMessage) || false,
                lessonComplete: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.lessonComplete) || false,
                weeklySummary: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.weeklySummary) || false,
                monthlySummary: (updatedSettings === null || updatedSettings === void 0 ? void 0 : updatedSettings.monthlySummary) || false,
            },
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.updateNotificationSettings = updateNotificationSettings;
