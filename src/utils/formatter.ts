import { format } from "date-fns";

export const removeUnderscoreFromString = (value: string) => {
  if (value) {
    if (value.includes("_")) {
      return value.replace(/_/g, " ");
    } else {
      return value.replace(/([a-z])([A-Z])/g, "$1 $2");
    }
  }
  return "";
};

export const isPastLesson = (lessonDate: Date, startTime: string): boolean => {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const lessonStr = format(lessonDate, "yyyy-MM-dd");

  if (lessonStr > todayStr) return false;
  if (lessonStr < todayStr) return true;

  return parseTime(startTime) <= new Date();
};

export const parseTime = (timeStr: string): Date => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    console.warn(
      `parseTime: could not parse "${timeStr}", falling back to current time`,
    );
    return new Date();
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const elapsedMinutes = (startTimeStr: string): number => {
  const start = parseTime(startTimeStr);
  const now = new Date();
  if (now <= start) return 0;
  return Math.floor((now.getTime() - start.getTime()) / 60_000);
};

export const lessonDuration = (value: number): string => {
  if (!value) return "0m";

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const lessonDateStartTime = (
  startTime: string,
  lessonDate: Date,
): Date => {
  const time = parseTime(startTime);
  const result = new Date(lessonDate);
  result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
  return result;
};

export const minutesLeftFromNow = (futureDateTime: Date): number | null => {
  const target = new Date(futureDateTime);
  const now = new Date();

  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return null;

  return Math.floor(diffMs / (1000 * 60));
};

export const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const paginationHelper = (pageNumber: string, pageSize: string) => {
  const newPageNumber = Math.max(1, Number(pageNumber) || 1);
  const newPageSize = Math.max(1, Math.min(Number(pageSize) || 10, 100));
  const offsetSize = (newPageNumber - 1) * newPageSize;
  return { newPageNumber, newPageSize, offsetSize };
};
