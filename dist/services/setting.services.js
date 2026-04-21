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
exports.updateNotificationSettingsByUserId = exports.createNotificationSettingsByUserId = exports.getNotificationSettingsByUserId = void 0;
const setting_models_1 = __importDefault(require("../models/setting.models"));
const getNotificationSettingsByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const settings = yield setting_models_1.default.findOne({
        where: {
            userId,
        },
    });
    return settings;
});
exports.getNotificationSettingsByUserId = getNotificationSettingsByUserId;
const createNotificationSettingsByUserId = (userId, notification) => __awaiter(void 0, void 0, void 0, function* () {
    const newSettings = {
        login: false,
        newLesson: false,
        lessonNotSubscribed: false,
        lessonSubscribed1Day: false,
        lessonSubscribed1Hour: false,
        lessonSubscribed30Minutes: false,
        lessonSubscribed15Minutes: false,
        lessonSubscribed5Minutes: false,
        newMessage: false,
        lessonComplete: false,
        weeklySummary: false,
        monthlySummary: false,
    };
    notification.forEach((item) => {
        newSettings[item.id] = item.value;
    });
    yield setting_models_1.default.create(Object.assign({ id: crypto.randomUUID(), userId }, newSettings));
});
exports.createNotificationSettingsByUserId = createNotificationSettingsByUserId;
const updateNotificationSettingsByUserId = (userId, notification) => __awaiter(void 0, void 0, void 0, function* () {
    const newSettings = {
        login: false,
        newLesson: false,
        lessonNotSubscribed: false,
        lessonSubscribed1Day: false,
        lessonSubscribed1Hour: false,
        lessonSubscribed30Minutes: false,
        lessonSubscribed15Minutes: false,
        lessonSubscribed5Minutes: false,
        newMessage: false,
        lessonComplete: false,
        weeklySummary: false,
        monthlySummary: false,
    };
    notification.forEach((item) => {
        newSettings[item.id] = item.value;
    });
    yield setting_models_1.default.update(newSettings, {
        where: {
            userId,
        },
    });
});
exports.updateNotificationSettingsByUserId = updateNotificationSettingsByUserId;
