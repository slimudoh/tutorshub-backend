import Report from "../models/report.models";
import { REPORT } from "../utils/constant";

export const createReport = async (
  userId: string,
  report: string,
  session: string,
  description: string,
  date: string,
) => {
  const user = await Report.create({
    id: crypto.randomUUID(),
    userId,
    sessionId: session,
    description,
    incidentDate: date,
    reportType: report,
    status: REPORT.PENDING,
  });

  return user;
};
