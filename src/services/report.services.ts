import { Op } from "@sequelize/core";
import Report from "../models/report.models";
import {
  REPORT,
  REPORT_EXCLUDED_ATTRIBUTES,
  USER_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import User from "../models/user.models";

export const createReport = async (
  userId: string,
  report: string,
  session: string,
  description: string,
  date: string,
  evidenceFile: string | null,
) => {
  const user = await Report.create({
    id: crypto.randomUUID(),
    userId,
    sessionId: session,
    description,
    incidentDate: date,
    reportType: report,
    evidenceFile,
    status: REPORT.PENDING,
  });

  return user;
};

export const getUserReports = async (
  keyword: string,
  status: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { reportType: { [Op.like]: `%${keyword}%` } },
        { status: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (status) {
    where = {
      ...where,
      status,
    };
  }

  if (!offsetSize && !newPageSize) {
    return await Report.count({ where });
  }

  const reports = await Report.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: REPORT_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });

  const users = await User.findAll({
    where: {
      id: {
        [Op.in]: reports.map((report) => report.userId),
      },
    },
    attributes: {
      exclude: USER_EXCLUDED_ATTRIBUTES,
    },
    raw: true,
  });

  const reportsWithUsers = reports.map((report) => {
    const user = users.find((user) => user.id === report.userId);
    return {
      ...report,
      user,
    };
  });

  return reportsWithUsers;
};

export const getReportsById = async (id: string) => {
  const report = await Report.findOne({
    where: { id },
    attributes: {
      exclude: REPORT_EXCLUDED_ATTRIBUTES,
    },
    raw: true,
  });

  if (report?.userId) {
    const user = await User.findOne({
      where: {
        id: report?.userId,
      },
      attributes: {
        exclude: USER_EXCLUDED_ATTRIBUTES,
      },
      raw: true,
    });

    return {
      ...report,
      user,
    };
  }

  return report;
};

export const updateReportStatus = async (id: string, status: string) => {
  await Report.update({ status }, { where: { id } });
};
