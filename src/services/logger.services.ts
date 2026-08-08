import winston from "winston";
import path from "path";

// Keep logs outside any publicly-served/static directory.
const LOG_DIR = path.join(__dirname, "logs");
export const ERROR_LOG_PATH = path.join(LOG_DIR, "errors.log");

export const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: ERROR_LOG_PATH,
      level: "error",
      // Safety net only — the digest script clears this file after each
      // successful send. This just prevents unbounded growth if a cron
      // run is ever missed.
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 2,
      tailable: true,
    }),
  ],
});
