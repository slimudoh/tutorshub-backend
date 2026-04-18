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
exports.getDeletedUser = exports.checkUserEmailVerificationStatus = exports.checkUserAccountStatus = exports.verifyUserPassword = exports.deleteUser = exports.deleteUserAvatar = exports.getUserProfile = exports.updateUserProfile = exports.updateUserStatus = exports.getAllUsers = exports.resetUserPassword = exports.forgotUserPassword = exports.verifyUserEmailByToken = exports.getTokenExpiryTime = exports.findUserByIdAndActiveToken = exports.compareSecretValues = exports.findUserByEmail = exports.findUserById = exports.createUser = exports.getUserName = exports.deleteUserByEmail = void 0;
const user_models_1 = __importDefault(require("../models/user.models"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const constant_1 = require("../utils/constant");
const sequelize_1 = require("sequelize");
const moment_1 = __importDefault(require("moment"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const deletedAccount_models_1 = __importDefault(require("../models/deletedAccount.models"));
const deleteUserByEmail = (emailAddress) => __awaiter(void 0, void 0, void 0, function* () {
    yield user_models_1.default.destroy({
        where: {
            emailAddress: emailAddress,
        },
    });
});
exports.deleteUserByEmail = deleteUserByEmail;
const getUserName = (firstName) => {
    const timestamp = Date.now().toString(36);
    const randomness = Math.random().toString(36).substring(2);
    return `${firstName.toLowerCase()}-${timestamp}${randomness}`;
};
exports.getUserName = getUserName;
const createUser = (firstName, lastName, emailAddress, phoneCode, phoneNumber, password) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedPassword = yield bcryptjs_1.default.hash(String(password), 15);
    const userName = (0, exports.getUserName)(firstName);
    const token = Math.floor(Math.random() * 900000) + 100000;
    const user = yield user_models_1.default.create({
        id: crypto_1.default.randomUUID(),
        firstName,
        lastName,
        userName,
        emailAddress,
        password: hashedPassword,
        role: constant_1.ROLES.USER,
        status: constant_1.STATUS.PENDING,
        emailVerified: constant_1.VERIFICATION.NOT_VERIFIED,
        token: token.toString(),
        phoneCode,
        phoneNumber,
        tokenExpiry: new Date(),
        tokenExpiryStatus: constant_1.STATUS.ACTIVE,
    });
    return user;
});
exports.createUser = createUser;
const findUserById = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, excludeAttributes = true) {
    return yield user_models_1.default.findOne(Object.assign(Object.assign({ where: {
            id: id,
        } }, (excludeAttributes && {
        attributes: {
            exclude: constant_1.USER_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.findUserById = findUserById;
const findUserByEmail = (emailAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_models_1.default.findOne({
        where: {
            emailAddress,
        },
    });
});
exports.findUserByEmail = findUserByEmail;
const compareSecretValues = (currentValue, userValue) => {
    return bcryptjs_1.default.compare(currentValue, userValue);
};
exports.compareSecretValues = compareSecretValues;
const findUserByIdAndActiveToken = (id, token) => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_models_1.default.findOne({
        where: {
            id,
            token,
            tokenExpiryStatus: constant_1.STATUS.ACTIVE,
            tokenExpiry: { [sequelize_1.Op.ne]: null },
        },
    });
});
exports.findUserByIdAndActiveToken = findUserByIdAndActiveToken;
const getTokenExpiryTime = (user) => {
    const expiryDate = (0, moment_1.default)(user.tokenExpiry);
    const currentDate = (0, moment_1.default)(new Date());
    const duration = moment_1.default.duration(currentDate.diff(expiryDate));
    const minutes = duration.minutes();
    return minutes;
};
exports.getTokenExpiryTime = getTokenExpiryTime;
const verifyUserEmailByToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    user.status = constant_1.STATUS.ACTIVE;
    user.emailVerified = constant_1.VERIFICATION.VERIFIED;
    user.emailVerifiedAt = new Date();
    user.tokenExpiryStatus = constant_1.STATUS.CLOSED;
    user.tokenExpiry = null;
    yield user.save();
});
exports.verifyUserEmailByToken = verifyUserEmailByToken;
const forgotUserPassword = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const token = Math.floor(Math.random() * 900000) + 100000;
    user.token = token.toString();
    user.tokenExpiry = new Date();
    user.tokenExpiryStatus = constant_1.STATUS.ACTIVE;
    user.password = crypto_1.default.randomUUID();
    yield user.save();
    return user;
});
exports.forgotUserPassword = forgotUserPassword;
const resetUserPassword = (user, password) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedPassword = yield bcryptjs_1.default.hash(String(password), 15);
    user.password = hashedPassword;
    user.tokenExpiryStatus = constant_1.STATUS.CLOSED;
    user.tokenExpiry = null;
    yield user.save();
});
exports.resetUserPassword = resetUserPassword;
const getAllUsers = (keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1) => __awaiter(void 0, [keyword_1, status_1, offsetSize_1, newPageSize_1, ...args_1], void 0, function* (keyword, status, offsetSize, newPageSize, excludeAttributes = true) {
    let where = {};
    if (keyword) {
        where = {
            [sequelize_1.Op.or]: [
                { firstName: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { lastName: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { emailAddress: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { phoneNumber: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ],
        };
    }
    if (status) {
        where = Object.assign(Object.assign({}, where), { status });
    }
    if (!offsetSize && !newPageSize) {
        return yield user_models_1.default.count({ where });
    }
    return yield user_models_1.default.findAll(Object.assign(Object.assign(Object.assign(Object.assign({ where, order: [["createdAt", "DESC"]] }, (offsetSize && { offset: offsetSize })), (newPageSize && { limit: newPageSize })), (excludeAttributes && {
        attributes: {
            exclude: constant_1.USER_EXCLUDED_ATTRIBUTES,
        },
    })), { raw: true }));
});
exports.getAllUsers = getAllUsers;
const updateUserStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    yield user_models_1.default.update({ status }, { where: { id } });
});
exports.updateUserStatus = updateUserStatus;
const updateUserProfile = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_models_1.default.update(data, { where: { id } });
});
exports.updateUserProfile = updateUserProfile;
const getUserProfile = (userProfile) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return {
        avatar: (_a = userProfile === null || userProfile === void 0 ? void 0 : userProfile.avatar) !== null && _a !== void 0 ? _a : "",
        firstName: (_b = userProfile === null || userProfile === void 0 ? void 0 : userProfile.firstName) !== null && _b !== void 0 ? _b : "",
        lastName: (_c = userProfile === null || userProfile === void 0 ? void 0 : userProfile.lastName) !== null && _c !== void 0 ? _c : "",
        emailAddress: (_d = userProfile === null || userProfile === void 0 ? void 0 : userProfile.emailAddress) !== null && _d !== void 0 ? _d : "",
        phoneCode: (_e = userProfile === null || userProfile === void 0 ? void 0 : userProfile.phoneCode) !== null && _e !== void 0 ? _e : "",
        phoneNumber: (_f = userProfile === null || userProfile === void 0 ? void 0 : userProfile.phoneNumber) !== null && _f !== void 0 ? _f : "",
        profession: (_g = userProfile === null || userProfile === void 0 ? void 0 : userProfile.profession) !== null && _g !== void 0 ? _g : "",
        userName: (_h = userProfile === null || userProfile === void 0 ? void 0 : userProfile.userName) !== null && _h !== void 0 ? _h : "",
        dateOfBirth: (_j = userProfile === null || userProfile === void 0 ? void 0 : userProfile.dateOfBirth) !== null && _j !== void 0 ? _j : "",
        country: (_k = userProfile === null || userProfile === void 0 ? void 0 : userProfile.country) !== null && _k !== void 0 ? _k : "",
        address: (_l = userProfile === null || userProfile === void 0 ? void 0 : userProfile.address) !== null && _l !== void 0 ? _l : "",
    };
};
exports.getUserProfile = getUserProfile;
const deleteUserAvatar = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = path_1.default.join(__dirname, "../../uploads", filename);
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlinkSync(filePath);
    }
});
exports.deleteUserAvatar = deleteUserAvatar;
const deleteUser = (id, reason, description) => __awaiter(void 0, void 0, void 0, function* () {
    yield user_models_1.default.update({ status: constant_1.STATUS.DEACTIVATED }, { where: { id } });
    yield deletedAccount_models_1.default.create({
        id: crypto_1.default.randomUUID(),
        userId: id,
        reason,
        description,
    });
});
exports.deleteUser = deleteUser;
const verifyUserPassword = (password, userPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcryptjs_1.default.compare(password, userPassword);
});
exports.verifyUserPassword = verifyUserPassword;
const checkUserAccountStatus = (status) => __awaiter(void 0, void 0, void 0, function* () {
    if (!status) {
        return {
            message: "Your account has been deleted. Please contact support.",
            status: 401,
        };
    }
    if (status === constant_1.STATUS.DEACTIVATED) {
        return {
            message: "Your account has been deactivated. Please contact support.",
            status: 401,
        };
    }
    if (status === constant_1.STATUS.PENDING) {
        return {
            message: "Your account is pending.",
            status: 401,
        };
    }
    if (status === constant_1.STATUS.SUSPENDED) {
        return {
            message: "Your account has been suspended. Please contact support.",
            status: 401,
        };
    }
    if (status === constant_1.STATUS.INACTIVE) {
        return {
            message: "Your account has been deactivated. Please contact support.",
            status: 401,
        };
    }
    if (status === constant_1.STATUS.BANNED) {
        return {
            message: "Your account has been banned. Please contact support.",
            status: 401,
        };
    }
    return {
        message: "",
        status: 200,
    };
});
exports.checkUserAccountStatus = checkUserAccountStatus;
const checkUserEmailVerificationStatus = (emailVerified) => __awaiter(void 0, void 0, void 0, function* () {
    if (!emailVerified) {
        return {
            message: "Your email address has not been verified. Please verify your email address.",
            status: 401,
        };
    }
    if (emailVerified === constant_1.VERIFICATION.NOT_VERIFIED) {
        return {
            message: "Your email address has not been verified. Please verify your email address.",
            status: 401,
        };
    }
    return {
        message: "",
        status: 200,
    };
});
exports.checkUserEmailVerificationStatus = checkUserEmailVerificationStatus;
const getDeletedUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield deletedAccount_models_1.default.findOne({
        where: { userId },
        raw: true,
    });
});
exports.getDeletedUser = getDeletedUser;
