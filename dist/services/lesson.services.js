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
exports.findAllLessonsByIds = exports.getLiveLessons = exports.getLessonHistories = exports.updateLessonStatus = exports.getActiveLessons = exports.getUserLessons = exports.getAdminLessons = exports.findLessonById = void 0;
const sequelize_1 = require("sequelize");
const lesson_models_1 = __importDefault(require("../models/lesson.models"));
const constant_1 = require("../utils/constant");
const lessonHistory_models_1 = __importDefault(require("../models/lessonHistory.models"));
const findLessonById = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, excludeAttributes = true) {
    return yield lesson_models_1.default.findOne(Object.assign(Object.assign({ where: {
            id: id,
        } }, (excludeAttributes && {
        attributes: {
            exclude: constant_1.LESSON_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.findLessonById = findLessonById;
const getAdminLessons = (keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [{ title: { [sequelize_1.Op.like]: `%${keyword}%` } }],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    if (!offsetSize && !newPageSize) {
        return yield lesson_models_1.default.count({ where: Object.assign({}, where) });
    }
    return yield lesson_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign({}, where), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.LESSON_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getAdminLessons = getAdminLessons;
const getUserLessons = (userId_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [userId_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (userId, keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [{ title: { [sequelize_1.Op.like]: `%${keyword}%` } }],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    if (!offsetSize && !newPageSize) {
        return yield lesson_models_1.default.count({ where: Object.assign({ userId }, where) });
    }
    return yield lesson_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign({ userId }, where), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.LESSON_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getUserLessons = getUserLessons;
const getActiveLessons = (keyword_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [keyword_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (keyword, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [{ title: { [sequelize_1.Op.like]: `%${keyword}%` } }],
        };
    }
    if (!offsetSize && !newPageSize) {
        return yield lesson_models_1.default.count({ where: Object.assign({ status: constant_1.STATUS.ACTIVE }, where) });
    }
    return yield lesson_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign({ status: constant_1.STATUS.ACTIVE }, where), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.LESSON_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getActiveLessons = getActiveLessons;
const updateLessonStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    yield lesson_models_1.default.update({ status }, { where: { id } });
});
exports.updateLessonStatus = updateLessonStatus;
const getLessonHistories = (userId_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [userId_1, keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (userId, keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [{ title: { [sequelize_1.Op.like]: `%${keyword}%` } }],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    if (!offsetSize && !newPageSize) {
        return yield lessonHistory_models_1.default.count({ where: Object.assign({ userId }, where) });
    }
    return yield lessonHistory_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where: Object.assign({ userId }, where), order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.LESSON_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getLessonHistories = getLessonHistories;
const getLiveLessons = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield lesson_models_1.default.findAll({
        where: { isLive: true },
        raw: true,
    });
});
exports.getLiveLessons = getLiveLessons;
const findAllLessonsByIds = (ids) => __awaiter(void 0, void 0, void 0, function* () {
    return yield lesson_models_1.default.findAll({
        where: {
            id: {
                [sequelize_1.Op.in]: ids,
            },
        },
        raw: true,
    });
});
exports.findAllLessonsByIds = findAllLessonsByIds;
