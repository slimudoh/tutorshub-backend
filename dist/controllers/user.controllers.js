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
exports.deleteUsers = exports.getUserAvatar = exports.updateAvatar = exports.updateProfile = exports.removeAvatar = exports.reviewUsers = exports.getProfile = exports.getUser = exports.getUsers = void 0;
const user_services_1 = require("../services/user.services");
const error_services_1 = require("../services/error.services");
const auditLog_services_1 = require("../services/auditLog.services");
const constant_1 = require("../utils/constant");
const path_1 = __importDefault(require("path"));
const pricing_services_1 = require("../services/pricing.services");
const getUsers = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const users = yield (0, user_services_1.getAllUsers)(keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, user_services_1.getAllUsers)(keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: users,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getUsers = getUsers;
const getUser = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.params.id;
        const user = yield (0, user_services_1.findUserById)(userId);
        if (user) {
            user.deactivationDetails = yield (0, user_services_1.getDeletedUser)(userId);
            user.subscriptionPlan = yield (0, pricing_services_1.findUsersSubscriptionPlans)(userId);
        }
        response.status(201).json({
            data: user,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getUser = getUser;
const getProfile = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const userProfile = yield (0, user_services_1.findUserById)(userId);
        if (!userProfile) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        const profile = (0, user_services_1.getUserProfile)(userProfile);
        response.status(201).json({
            data: Object.assign({}, profile),
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getProfile = getProfile;
const reviewUsers = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, status } = request.body;
        const targetUser = yield (0, user_services_1.findUserById)(id);
        if (!targetUser) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        if (status !== constant_1.STATUS.ACTIVATE && status !== constant_1.STATUS.SUSPEND) {
            const error = new Error("Invalid status. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        if (status === constant_1.STATUS.PENDING) {
            const error = new Error("User is in PENDING status. You cannot review a pending user.");
            error.statusCode = 400;
            return next(error);
        }
        if (targetUser.status === status) {
            const error = new Error("User is already in the selected status. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        const newStatus = status === constant_1.STATUS.ACTIVATE ? constant_1.STATUS.ACTIVE : constant_1.STATUS.SUSPENDED;
        yield (0, user_services_1.updateUserStatus)(id, newStatus);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(targetUser),
            action: newStatus,
            oldData: JSON.stringify(targetUser),
            newData: JSON.stringify(Object.assign(Object.assign({}, targetUser), { status: newStatus })),
            section: "REVIEW USER",
        });
        response.status(201).json({
            message: "User reviewed successfully.",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.reviewUsers = reviewUsers;
const removeAvatar = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = request.user;
        const targetUser = yield (0, user_services_1.findUserById)(user.id);
        if (!targetUser) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        if (!targetUser.avatar) {
            const error = new Error("User avatar not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        yield (0, user_services_1.deleteUserAvatar)(targetUser.avatar);
        yield (0, user_services_1.updateUserProfile)(user.id, {
            avatar: null,
        });
        const userProfile = yield (0, user_services_1.findUserById)(user.id);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(targetUser),
            action: "REMOVE AVATAR",
            oldData: JSON.stringify(targetUser),
            newData: JSON.stringify(userProfile),
            section: "USER PROFILE",
        });
        if (!userProfile) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        const profile = (0, user_services_1.getUserProfile)(userProfile);
        response.status(201).json({
            message: "User avatar removed successfully.",
            data: Object.assign({}, profile),
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.removeAvatar = removeAvatar;
const updateProfile = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = request.user;
        const { firstName, lastName, phoneCode, phoneNumber, profession, userName, dateOfBirth, address, country, } = request.body;
        const targetUser = yield (0, user_services_1.findUserById)(user.id);
        if (!targetUser) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        yield (0, user_services_1.updateUserProfile)(user.id, {
            firstName,
            lastName,
            phoneCode,
            phoneNumber,
            profession,
            userName,
            dateOfBirth,
            address,
            country,
        });
        const userProfile = yield (0, user_services_1.findUserById)(user.id);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(targetUser),
            action: "UPDATE PROFILE",
            oldData: JSON.stringify(targetUser),
            newData: JSON.stringify(userProfile),
            section: "USER PROFILE",
        });
        if (!userProfile) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        const profile = (0, user_services_1.getUserProfile)(userProfile);
        response.status(201).json({
            message: "User profile updated successfully.",
            data: Object.assign({}, profile),
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.updateProfile = updateProfile;
const updateAvatar = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = request.user;
        const targetUser = yield (0, user_services_1.findUserById)(user.id);
        if (!targetUser) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        if (targetUser === null || targetUser === void 0 ? void 0 : targetUser.avatar) {
            yield (0, user_services_1.deleteUserAvatar)(targetUser.avatar);
        }
        const file = request.file;
        if (!file) {
            const error = new Error("File is required. Please try again later.");
            error.statusCode = 400;
            return next(error);
        }
        yield (0, user_services_1.updateUserProfile)(user.id, {
            avatar: file.filename,
        });
        const userProfile = yield (0, user_services_1.findUserById)(user.id);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(targetUser),
            action: "UPDATE AVATAR",
            oldData: JSON.stringify(targetUser),
            newData: JSON.stringify(userProfile),
            section: "USER PROFILE",
        });
        if (!userProfile) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        const profile = (0, user_services_1.getUserProfile)(userProfile);
        response.status(201).json({
            message: "User avatar updated successfully.",
            data: Object.assign({}, profile),
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.updateAvatar = updateAvatar;
const getUserAvatar = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filePath = path_1.default.join(__dirname, "../../uploads", request.params.name);
        response.sendFile(filePath);
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getUserAvatar = getUserAvatar;
const deleteUsers = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { password, reason, description } = request.body;
        const targetUser = yield (0, user_services_1.findUserById)(userId, false);
        if (!(targetUser === null || targetUser === void 0 ? void 0 : targetUser.password)) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        const isPasswordValid = yield (0, user_services_1.verifyUserPassword)(password, targetUser.password);
        if (!isPasswordValid) {
            const error = new Error("Invalid password. Please try again later.");
            error.statusCode = 401;
            return next(error);
        }
        yield (0, user_services_1.deleteUser)(userId, reason, description);
        const userProfile = yield (0, user_services_1.findUserById)(userId);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(targetUser),
            action: "DELETE USER",
            oldData: JSON.stringify(targetUser),
            newData: JSON.stringify(Object.assign(Object.assign({}, userProfile), { reason,
                description })),
            section: "USER PROFILE",
        });
        if (!userProfile) {
            const error = new Error("User not found. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        const profile = (0, user_services_1.getUserProfile)(userProfile);
        response.status(201).json({
            message: "User deleted successfully.",
            data: Object.assign({}, profile),
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.deleteUsers = deleteUsers;
