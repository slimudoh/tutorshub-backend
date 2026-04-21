"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVIEW_EXCLUDED_ATTRIBUTES = exports.SUBSCRIBER_EXCLUDED_ATTRIBUTES = exports.PRICING_PLAN_EXCLUDED_ATTRIBUTES = exports.TRANSACTION_EXCLUDED_ATTRIBUTES = exports.MESSAGE_EXCLUDED_ATTRIBUTES = exports.LESSON_EXCLUDED_ATTRIBUTES = exports.USER_EXCLUDED_ATTRIBUTES = exports.LESSON_LEVEL = exports.MAIL_CONFIG = exports.VERIFICATION = exports.TRANSACTION_TYPE = exports.STATUS = exports.APP_URL = exports.APP_NAME = exports.ROLES = void 0;
exports.ROLES = {
    USER: "USER",
    ADMIN: "ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN",
};
exports.APP_NAME = "TutorsHub";
exports.APP_URL = "http://localhost:3000";
exports.STATUS = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    SUSPEND: "SUSPEND",
    SUSPENDED: "SUSPENDED",
    CLOSED: "CLOSED",
    ACTIVATE: "ACTIVATE",
    DEACTIVATED: "DEACTIVATED",
    BANNED: "BANNED",
    INACTIVE: "INACTIVE",
};
exports.TRANSACTION_TYPE = {
    PAYMENT: "PAYMENT",
    PAYOUT: "PAYOUT",
    EARNING: "EARNING",
};
exports.VERIFICATION = {
    VERIFIED: "VERIFIED",
    NOT_VERIFIED: "NOT_VERIFIED",
};
exports.MAIL_CONFIG = {
    sender: "no-reply@one-block.org",
    email: "no-reply@one-block.org",
    password: "P8B(8b]z37d[",
    host: "mail.one-block.org",
    // sender: "hello@companyqat.com",
    // email: "hello@ribigifts.com",
    // password: "Summytwe1234)(&2",
    // host: "mail.ribigifts.com",
};
exports.LESSON_LEVEL = {
    BEGINNER: "BEGINNER",
    INTERMEDIATE: "INTERMEDIATE",
    ADVANCED: "ADVANCED",
    ALL: "ALL",
};
exports.USER_EXCLUDED_ATTRIBUTES = [
    "password",
    "emailVerified",
    "emailVerifiedAt",
    "token",
    "tokenExpiry",
    "tokenExpiryStatus",
];
exports.LESSON_EXCLUDED_ATTRIBUTES = [];
exports.MESSAGE_EXCLUDED_ATTRIBUTES = [];
exports.TRANSACTION_EXCLUDED_ATTRIBUTES = [];
exports.PRICING_PLAN_EXCLUDED_ATTRIBUTES = [];
exports.SUBSCRIBER_EXCLUDED_ATTRIBUTES = [];
exports.REVIEW_EXCLUDED_ATTRIBUTES = [];
