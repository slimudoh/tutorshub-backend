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
exports.logoutUser = exports.resendToken = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.loginUser = exports.registerUser = void 0;
const constant_1 = require("../utils/constant");
const user_services_1 = require("../services/user.services");
const email_services_1 = require("../services/email.services");
const auth_services_1 = require("../services/auth.services");
const error_services_1 = require("../services/error.services");
const auditLog_services_1 = require("../services/auditLog.services");
const setting_services_1 = require("../services/setting.services");
const moment_1 = __importDefault(require("moment"));
const message_services_1 = require("../services/message.services");
const registerUser = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, emailAddress, phoneCode, phoneNumber, password, } = request.body;
        const user = yield (0, user_services_1.createUser)(firstName, lastName, emailAddress, phoneCode, phoneNumber, password);
        const options = {
            from: constant_1.MAIL_CONFIG.sender,
            to: emailAddress,
            subject: `Message from ${constant_1.APP_NAME}`,
            template: "register.views",
            context: {
                name: user.firstName,
                token: user.token,
                appName: constant_1.APP_NAME,
                year: new Date().getFullYear(),
            },
        };
        (0, email_services_1.sendMail)(options);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "REGISTER",
            newData: JSON.stringify(user),
            section: "REGISTER",
        });
        response.status(201).json({
            message: `Profile created successfully. A verification email has been sent to ${emailAddress} to verify your account. Please check your email for verification details and also check  your spam mail if you can't find it in your inbox.`,
            data: user.id,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.registerUser = registerUser;
const loginUser = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { emailAddress, password } = request.body;
        const user = yield (0, user_services_1.findUserByEmail)(emailAddress);
        if (!(user === null || user === void 0 ? void 0 : user.password)) {
            const error = new Error("Password is not correct.");
            error.statusCode = 404;
            return next(error);
        }
        const userPassword = yield (0, user_services_1.compareSecretValues)(password, user.password);
        if (!userPassword) {
            const error = new Error("Password is not correct.");
            error.statusCode = 403;
            return next(error);
        }
        const accountStatus = yield (0, user_services_1.checkUserAccountStatus)(user.status);
        if (accountStatus.status !== 200) {
            const error = new Error(accountStatus.message);
            error.statusCode = accountStatus.status;
            return next(error);
        }
        if (user.emailVerified === constant_1.VERIFICATION.NOT_VERIFIED) {
            if (!(user === null || user === void 0 ? void 0 : user.emailAddress)) {
                const error = new Error("Something went wrong. Please try again later.");
                error.statusCode = 404;
                return next(error);
            }
            const updatedUser = yield (0, auth_services_1.generateEmailToken)(user);
            response.status(201).json({
                data: { id: updatedUser.id },
                message: `An email verification link has been sent to ${updatedUser.emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
            });
            const options = {
                from: constant_1.MAIL_CONFIG.sender,
                to: user.emailAddress,
                subject: `Message from ${constant_1.APP_NAME}`,
                template: "newToken.views",
                context: {
                    name: user.firstName,
                    link: `${constant_1.APP_URL}/email-verification/${updatedUser.token}`,
                    year: new Date().getFullYear(),
                },
            };
            return (0, email_services_1.sendMail)(options);
        }
        const token = yield (0, auth_services_1.generateAuthToken)(user);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "LOGIN",
            newData: JSON.stringify({
                ip: request.ip,
                userAgent: request.headers["user-agent"],
            }),
            section: "LOGIN",
        });
        response.status(201).json({
            message: "Login successful",
            data: { token },
        });
        const settings = yield (0, setting_services_1.getNotificationSettingsByUserId)((_a = user === null || user === void 0 ? void 0 : user.id) !== null && _a !== void 0 ? _a : "");
        if (!(settings === null || settings === void 0 ? void 0 : settings.login)) {
            return;
        }
        const options = {
            from: constant_1.MAIL_CONFIG.sender,
            to: emailAddress,
            subject: `Message from ${constant_1.APP_NAME}`,
            template: "login.views",
            context: {
                name: user.firstName,
                time: (0, moment_1.default)().format("DD/MM/YYYY HH:mm:ss"),
                year: new Date().getFullYear(),
            },
        };
        (0, email_services_1.sendMail)(options);
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.loginUser = loginUser;
const verifyEmail = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, token } = request.body;
        const user = yield (0, user_services_1.findUserByIdAndActiveToken)(id, token);
        if (!user) {
            const error = new Error("Token not found. Please try again or request a new token.");
            error.statusCode = 400;
            return next(error);
        }
        const minutes = (0, user_services_1.getTokenExpiryTime)(user);
        if (minutes > 5) {
            const error = new Error("Token expired. Please request a new token.");
            error.statusCode = 400;
            return next(error);
        }
        yield (0, user_services_1.verifyUserEmailByToken)(user);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "VERIFY_EMAIL",
            newData: JSON.stringify(user),
            section: "VERIFY_EMAIL",
        });
        const newMessage = `
   <p> We're excited to have you join our learning community. You're now one step closer to gaining new skills and achieving your goals.</p>

   <p>Get started by exploring your dashboard, choosing a lesson that interests you, and beginning your learning journey today.</p>
   <p>If you ever need help, we're here to support you every step of the way.</p>

   <p>Happy learning!</p>

    `;
        yield (0, message_services_1.createMessage)("Welcome!!!", newMessage, (_a = user === null || user === void 0 ? void 0 : user.id) !== null && _a !== void 0 ? _a : "");
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "NEW MESSAGE",
            newData: JSON.stringify({
                title: "Welcome!!!",
                message: newMessage,
                receiverId: user,
                senderId: null,
            }),
            section: "MESSAGE",
        });
        response.status(201).json({
            message: `Hi ${user.firstName}, your email is verified successfully. Please log in to continue`,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.verifyEmail = verifyEmail;
const forgotPassword = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { emailAddress } = request.body;
        const user = yield (0, user_services_1.findUserByEmail)(emailAddress);
        if (!(user === null || user === void 0 ? void 0 : user.emailAddress)) {
            const error = new Error("Email does not exist.");
            error.statusCode = 404;
            return next(error);
        }
        const accountStatus = yield (0, user_services_1.checkUserAccountStatus)(user.status);
        if (accountStatus.status !== 200) {
            const error = new Error(accountStatus.message);
            error.statusCode = accountStatus.status;
            return next(error);
        }
        const emailVerificationStatus = yield (0, user_services_1.checkUserEmailVerificationStatus)(user.emailVerified);
        if (emailVerificationStatus.status !== 200) {
            const error = new Error(emailVerificationStatus.message);
            error.statusCode = emailVerificationStatus.status;
            return next(error);
        }
        const updateUser = yield (0, user_services_1.forgotUserPassword)(user);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "FORGOT_PASSWORD",
            newData: JSON.stringify(updateUser),
            section: "FORGOT_PASSWORD",
        });
        response.status(201).json({
            message: `A password reset email has been sent to ${emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
            data: user.id,
        });
        const options = {
            from: constant_1.MAIL_CONFIG.sender,
            to: emailAddress,
            subject: `Message from ${constant_1.APP_NAME}`,
            template: "forgotPassword.views",
            context: {
                name: user.firstName,
                token: updateUser.token,
                year: new Date().getFullYear(),
            },
        };
        (0, email_services_1.sendMail)(options);
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, token, password } = request.body;
        const user = yield (0, user_services_1.findUserByIdAndActiveToken)(id, token);
        if (!user) {
            const error = new Error("User not found. Please try again or request a new email link.");
            error.statusCode = 400;
            return next(error);
        }
        const minutes = (0, user_services_1.getTokenExpiryTime)(user);
        if (minutes > 5) {
            return response.status(400).json({
                message: "Email link expired. Please request a new email link.",
            });
        }
        yield (0, user_services_1.resetUserPassword)(user, password);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "RESET_PASSWORD",
            newData: JSON.stringify(user),
            section: "RESET_PASSWORD",
        });
        response.status(201).json({
            message: "Password reset successful. Please login to continue.",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.resetPassword = resetPassword;
const resendToken = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = request.params) === null || _a === void 0 ? void 0 : _a.id)) {
            const error = new Error("Something went wrong. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        const user = yield (0, user_services_1.findUserById)(request.params.id, false);
        if (!(user === null || user === void 0 ? void 0 : user.emailAddress)) {
            const error = new Error("Something went wrong. Please try again later.");
            error.statusCode = 404;
            return next(error);
        }
        if ((user === null || user === void 0 ? void 0 : user.tokenExpiryStatus) !== constant_1.STATUS.ACTIVE) {
            const error = new Error("You do not have an active request that needs a token.");
            error.statusCode = 400;
            return next(error);
        }
        const updatedUser = yield (0, auth_services_1.generateEmailToken)(user);
        yield (0, auditLog_services_1.createAuditLog)({
            user: JSON.stringify(user),
            action: "RESEND_TOKEN",
            newData: JSON.stringify(updatedUser),
            section: "RESEND_TOKEN",
        });
        response.status(201).json({
            message: `A token has been sent to ${user.emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
        });
        const options = {
            from: constant_1.MAIL_CONFIG.sender,
            to: user.emailAddress,
            subject: `Message from ${constant_1.APP_NAME}`,
            template: "newToken.views",
            context: {
                name: user.firstName,
                token: updatedUser.token,
                year: new Date().getFullYear(),
            },
        };
        (0, email_services_1.sendMail)(options);
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.resendToken = resendToken;
const logoutUser = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const token = request.header("Authorization")
            ? (_b = request.header("Authorization")) === null || _b === void 0 ? void 0 : _b.split(" ")[1]
            : null;
        if (!token) {
            return response.status(201).json({
                message: "Logout successful.",
            });
        }
        const checkIfBlacklisted = yield (0, auth_services_1.findExpiredTokenById)(token);
        if (checkIfBlacklisted) {
            return response.status(201).json({
                message: "Logout successful.",
            });
        }
        yield (0, auth_services_1.createBlackListToken)(token);
        const user = yield (0, user_services_1.findUserById)(userId);
        if (user) {
            yield (0, auditLog_services_1.createAuditLog)({
                user: JSON.stringify(user),
                action: "LOGOUT",
                newData: JSON.stringify({
                    ip: request.ip,
                    userAgent: request.headers["user-agent"],
                }),
                section: "LOGOUT",
            });
        }
        response.status(201).json({
            message: "Logout successful.",
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.logoutUser = logoutUser;
