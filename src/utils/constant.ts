export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
};

export const APP_NAME = "TutorsHub";

export const APP_URL = "http://localhost:3000";

export const STATUS = {
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

export const VERIFICATION = {
  VERIFIED: "VERIFIED",
  NOT_VERIFIED: "NOT_VERIFIED",
};

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

export const COURSE_LEVEL = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  ALL: "ALL",
};

export const USER_EXCLUDED_ATTRIBUTES = [
  "password",
  "emailVerified",
  "emailVerifiedAt",
  "token",
  "tokenExpiry",
  "tokenExpiryStatus",
];

export const COURSE_EXCLUDED_ATTRIBUTES = [];

export const MESSAGE_EXCLUDED_ATTRIBUTES = [];

export const TRANSACTION_EXCLUDED_ATTRIBUTES = [];

export const PRICING_PLAN_EXCLUDED_ATTRIBUTES = [];
