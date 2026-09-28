import { Op } from "sequelize";

/**
 * ============================================
 * Model-Specific Searchable Field Configurations
 * ============================================
 * 
 * Define searchable fields for each model here.
 * This centralizes search behavior and makes it easy to maintain.
 */

/**
 * Lesson model searchable fields.
 */
export const LESSON_SEARCHABLE_FIELDS = [
  "title",
  "description",
  "level",
  "language",
  "status",
  "externalFriendlyUrl",
  "externalRoomId",
  "seoTitle",
  "seoDescription",
  "seoTags",
  "categoryId",
  "durationMinutes",
  "lateJoinMinutes",
  "maxStudents",
  "startTime",
  "endTime",
  "lectures",
  "lessonDate",
  "creditsRequired",
] as const;

/**
 * Category model searchable fields.
 */
export const CATEGORY_SEARCHABLE_FIELDS = [
  "title",
  "status",
  "description",
  "slug",
] as const;

/**
 * User model searchable fields.
 */
export const USER_SEARCHABLE_FIELDS = [
  "firstName",
  "lastName",
  "emailAddress",
  "phoneNumber",
  "userName",
  "role",
  "country",
  "dateOfBirth",
  "address",
  "status",
  "profession",
] as const;

/**
 * Newsletter model searchable fields.
 */
export const NEWSLETTER_SEARCHABLE_FIELDS = [
  "email",
  "firstName",
  "lastName",
] as const;

/**
 * AuditLog model searchable fields.
 */
export const AUDIT_LOG_SEARCHABLE_FIELDS = [
  "user",
  "action",
  "oldData",
  "newData",
  "section",
] as const;

/**
 * Currency model searchable fields.
 */
export const CURRENCY_SEARCHABLE_FIELDS = [
  "country",
  "countryCode",
  "currency",
  "symbol",
  "amount",
  "status",
] as const;

/**
 * Instructor model searchable fields.
 */
export const INSTRUCTOR_SEARCHABLE_FIELDS = [
  "firstName",
  "lastName",
  "skills",
  "languages",
  "bio",
  "profession",
  "socialLinks",
  "status",
  "experience",
] as const;

/**
 * PricingPlan model searchable fields.
 */
export const PRICING_SEARCHABLE_FIELDS = [
  "name",
  "description",
  "status",
  "currency",
  "billingCycle",
  "amount",
  "lessonLimit",
] as const;

/**
 * Report model searchable fields.
 */
export const REPORT_SEARCHABLE_FIELDS = [
  "reportType",
  "status",
  "incidentDate",
  "evidenceFile",
  "sessionId",
  "description",
] as const;

/**
 * Transaction model searchable fields.
 */
export const TRANSACTION_SEARCHABLE_FIELDS = [
  "currency",
  "reference",
  "channel",
  "amount",
  "purpose",
  "lessonId",
  "status",
  "transactionType",
] as const;

/**
 * Type representing searchable fields for any model.
 */
export type SearchableField = string;

/**
 * ============================================
 * Search WHERE Clause Builders
 * ============================================
 */

/**
 * Builds a Sequelize WHERE clause for searching across fields.
 * 
 * @param keyword - The search term to match against fields
 * @param fields - Array of fields to search (e.g., LESSON_SEARCHABLE_FIELDS)
 * @returns Sequelize WHERE clause object, or empty object if no keyword provided
 * 
 * @example
 * // Search Lesson by keyword across all lesson fields
 * const where = buildSearchWhere("math", LESSON_SEARCHABLE_FIELDS);
 * 
 * @example
 * // Search Category by keyword across title and status
 * const where = buildSearchWhere("science", CATEGORY_SEARCHABLE_FIELDS);
 * 
 * @example
 * // Search with custom fields
 * const where = buildSearchWhere("test", ["title", "description"]);
 */
export const buildSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = [],
): Record<string, any> => {
  if (!keyword || !keyword.trim() || fields.length === 0) {
    return {};
  }

  const trimmedKeyword = keyword.trim();

  // Single field optimization - avoid Op.or for single field
  if (fields.length === 1) {
    return {
      [fields[0]]: { [Op.like]: `%${trimmedKeyword}%` },
    };
  }

  // Multiple fields - use Op.or
  return {
    [Op.or]: fields.map((field) => ({
      [field]: { [Op.like]: `%${trimmedKeyword}%` },
    })),
  };
};

/**
 * Convenience function for building Lesson search WHERE clause.
 * Uses all LESSON_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to LESSON_SEARCHABLE_FIELDS)
 */
export const buildLessonSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = LESSON_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building Category search WHERE clause.
 * Uses all CATEGORY_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to CATEGORY_SEARCHABLE_FIELDS)
 */
export const buildCategorySearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = CATEGORY_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building User search WHERE clause.
 * Uses all USER_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to USER_SEARCHABLE_FIELDS)
 */
export const buildUserSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = USER_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building Newsletter search WHERE clause.
 * Uses all NEWSLETTER_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to NEWSLETTER_SEARCHABLE_FIELDS)
 */
export const buildNewsletterSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = NEWSLETTER_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building AuditLog search WHERE clause.
 * Uses all AUDIT_LOG_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to AUDIT_LOG_SEARCHABLE_FIELDS)
 */
export const buildAuditLogSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = AUDIT_LOG_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building Currency search WHERE clause.
 * Uses all CURRENCY_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to CURRENCY_SEARCHABLE_FIELDS)
 */
export const buildCurrencySearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = CURRENCY_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building Instructor search WHERE clause.
 * Uses all INSTRUCTOR_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to INSTRUCTOR_SEARCHABLE_FIELDS)
 */
export const buildInstructorSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = INSTRUCTOR_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building PricingPlan search WHERE clause.
 * Uses all PRICING_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to PRICING_SEARCHABLE_FIELDS)
 */
export const buildPricingSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = PRICING_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building Report search WHERE clause.
 * Uses all REPORT_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to REPORT_SEARCHABLE_FIELDS)
 */
export const buildReportSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = REPORT_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Convenience function for building Transaction search WHERE clause.
 * Uses all TRANSACTION_SEARCHABLE_FIELDS by default.
 * 
 * @param keyword - The search term
 * @param fields - Optional custom fields to search (defaults to TRANSACTION_SEARCHABLE_FIELDS)
 */
export const buildTransactionSearchWhere = (
  keyword?: string,
  fields: readonly SearchableField[] = TRANSACTION_SEARCHABLE_FIELDS,
): Record<string, any> => {
  return buildSearchWhere(keyword, fields);
};

/**
 * Builds a Sequelize WHERE clause with additional conditions combined with search.
 * 
 * @param keyword - The search term
 * @param additionalWhere - Additional WHERE conditions to merge with search
 * @param fields - Fields to search
 * @returns Combined WHERE clause
 * 
 * @example
 * const where = buildSearchWhereWithConditions("math", { status: "ACTIVE" }, LESSON_SEARCHABLE_FIELDS);
 * // Result: { [Op.and]: [{ [Op.or]: [...] }, { status: "ACTIVE" }] }
 */
export const buildSearchWhereWithConditions = (
  keyword?: string,
  additionalWhere: Record<string, any> = {},
  fields: readonly SearchableField[] = [],
): Record<string, any> => {
  const searchWhere = buildSearchWhere(keyword, fields);

  if (Object.keys(searchWhere).length === 0) {
    return additionalWhere;
  }

  if (Object.keys(additionalWhere).length === 0) {
    return searchWhere;
  }

  return {
    [Op.and]: [searchWhere, additionalWhere],
  };
};

/**
 * ============================================
 * Legacy Exports (for backward compatibility)
 * ============================================
 */

// Re-export for existing code that may use these
export type LessonSearchableField = typeof LESSON_SEARCHABLE_FIELDS[number];
