import { Op } from "@sequelize/core";
import Report from "../models/report.models";
import {
  REPORT,
  REPORT_EXCLUDED_ATTRIBUTES,
  USER_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import User from "../models/user.models";
import { buildReportSearchWhere } from "../utils/search";

export const createReport = async (
  userId: string,
  report: string,
  description: string,
  date: string,
  evidenceFile: string | null,
) => {
  return await Report.create({
    id: crypto.randomUUID(),
    userId,
    description,
    incidentDate: date,
    reportType: report,
    evidenceFile,
    status: REPORT.PENDING,
  });
};

export const getUserReports = async (
  keyword: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  const where = buildReportSearchWhere(keyword);

  if (!offsetSize && !newPageSize) {
    return await Report.count({ where });
  }

  const reports = await Report.findAll({
    where,
    order: [["updatedAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: REPORT_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });

  if (!reports.length) return [];

  const userIds = [...new Set(reports.map((r) => r.userId))];
  const users = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: { exclude: USER_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  return reports.map((report) => ({
    ...report,
    user: users.find((u) => u.id === report.userId) || null,
  }));
};

export const getReportsById = async (id: string) => {
  const report = await Report.findOne({
    where: { id },
    attributes: { exclude: REPORT_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  if (!report?.userId) return report;

  const user = await User.findOne({
    where: { id: report.userId },
    attributes: { exclude: USER_EXCLUDED_ATTRIBUTES },
    raw: true,
  });

  return { ...report, user };
};

export const updateReportStatus = async (id: string, status: string) => {
  await Report.update({ status }, { where: { id } });
};
