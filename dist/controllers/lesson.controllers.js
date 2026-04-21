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
exports.getMyLessonHistory = exports.getLiveSessionsLessons = exports.getAllUserLessons = exports.getAllActiveLessons = exports.reviewAdminLessons = exports.getAllLessons = void 0;
const error_services_1 = require("../services/error.services");
const lesson_services_1 = require("../services/lesson.services");
const constant_1 = require("../utils/constant");
const auditLog_services_1 = require("../services/auditLog.services");
const user_services_1 = require("../services/user.services");
const getAllLessons = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const lesson = yield (0, lesson_services_1.getAdminLessons)(keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, lesson_services_1.getAdminLessons)(keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: lesson,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAllLessons = getAllLessons;
const reviewAdminLessons = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id, status } = request.body;
        const lesson = yield (0, lesson_services_1.findLessonById)(id);
        if (!lesson) {
            const error = new Error("Lesson not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        if (status !== constant_1.STATUS.ACTIVATE && status !== constant_1.STATUS.SUSPEND) {
            const error = new Error("Invalid status. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        if (status === constant_1.STATUS.PENDING) {
            const error = new Error("Lesson is in PENDING status. You cannot review a pending lesson.");
            error.statusCode = 400;
            return next(error);
        }
        if (lesson.status === status) {
            const error = new Error("Lesson is already in the selected status. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        const newStatus = status === constant_1.STATUS.ACTIVATE ? constant_1.STATUS.ACTIVE : constant_1.STATUS.SUSPENDED;
        yield (0, lesson_services_1.updateLessonStatus)(id, newStatus);
        const targetUser = yield (0, user_services_1.findUserById)(userId);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(targetUser),
            action: newStatus,
            oldData: JSON.stringify(lesson),
            newData: JSON.stringify(Object.assign(Object.assign({}, lesson), { status: newStatus })),
            section: "REVIEW LESSON",
        });
        response.status(201).json({
            message: "Lesson reviewed successfully.",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.reviewAdminLessons = reviewAdminLessons;
const getAllActiveLessons = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const lesson = yield (0, lesson_services_1.getActiveLessons)(keyword, offsetSize, newPageSize);
        const totalPages = yield (0, lesson_services_1.getActiveLessons)(keyword);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: lesson,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAllActiveLessons = getAllActiveLessons;
const getAllUserLessons = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const lesson = yield (0, lesson_services_1.getUserLessons)(userId, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, lesson_services_1.getUserLessons)(userId, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: lesson,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAllUserLessons = getAllUserLessons;
const getLiveSessionsLessons = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lesson = yield (0, lesson_services_1.getLiveLessons)();
        response.status(201).json({
            data: lesson,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getLiveSessionsLessons = getLiveSessionsLessons;
const getMyLessonHistory = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const lessonHistories = yield (0, lesson_services_1.getLessonHistories)(userId, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, lesson_services_1.getLessonHistories)(userId, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: lessonHistories,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getMyLessonHistory = getMyLessonHistory;
