export const ROLES = {
  USER: "USER",
  INSTRUCTOR: "INSTRUCTOR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
};

export const APP_NAME = "TutorsHub";

export const APP_URL = "http://localhost:3000";

export const LESSON = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPEND: "SUSPEND",
  SUSPENDED: "SUSPENDED",
  ACTIVATE: "ACTIVATE",
  DEACTIVATED: "DEACTIVATED",
};

export const USER = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
  DEACTIVATED: "DEACTIVATED",
  CLOSED: "CLOSED",
  ACTIVATE: "ACTIVATE",
  SUSPEND: "SUSPEND",
};

export const INSTRUCTOR = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
  DEACTIVATED: "DEACTIVATED",
};

export const PRICING = {
  SUSPEND: "SUSPEND",
  ACTIVATE: "ACTIVATE",
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
};

export const CURRENCY = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  ACTIVATE: "ACTIVATE",
  PENDING: "PENDING",
  SUSPEND: "SUSPEND",
};

export const TRANSACTION_TYPE = {
  PAYMENT: "PAYMENT",
  PAYOUT: "PAYOUT",
  EARNING: "EARNING",
};

export const VERIFICATION = {
  VERIFIED: "VERIFIED",
  NOT_VERIFIED: "NOT_VERIFIED",
};

export const CATEGORY = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  ACTIVATE: "ACTIVATE",
  PENDING: "PENDING",
  SUSPEND: "SUSPEND",
};

export const MESSAGE = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
};

export const REPORT = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

export const LESSON_LEVEL = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  ALL: "ALL",
};

export const PLAN_BILLING_CYCLE = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
};

export const SUBSCRIPTION = {
  ACTIVE: "ACTIVE",
  CANCELED: "CANCELED",
  EXPIRED: "EXPIRED",
  CANCEL: "CANCEL",
};

export const LESSON_ENROLLMENT = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
};

export const REVIEW = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  SUSPEND: "SUSPEND",
  ACTIVATE: "ACTIVATE",
};

export const USER_EXCLUDED_ATTRIBUTES = [
  "password",
  "emailVerified",
  "emailVerifiedAt",
  "token",
  "tokenExpiry",
  "tokenExpiryStatus",
];

export const INSTRUCTOR_EXCLUDED_ATTRIBUTES = [];

export const MESSAGE_EXCLUDED_ATTRIBUTES = ["userId"];

export const LESSON_EXCLUDED_ATTRIBUTES = [];

export const NOTIFICATION_EXCLUDED_ATTRIBUTES = [];

export const TRANSACTION_EXCLUDED_ATTRIBUTES = [];

export const PRICING_PLAN_EXCLUDED_ATTRIBUTES = [];

export const ENROLLEE_EXCLUDED_ATTRIBUTES = [];

export const REVIEW_EXCLUDED_ATTRIBUTES = [];

export const REPORT_EXCLUDED_ATTRIBUTES = [];

export const MAIL_CONFIG = {
  sender: "no-reply@one-block.org",
  email: "no-reply@one-block.org",
  password: "P8B(8b]z37d[",
  host: "mail.one-block.org",
  // sender: "hello@companyqat.com",
  // email: "hello@ribigifts.com",
  // password: "Summytwe1234)(&2",
  // host: "mail.ribigifts.com",
};
