import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import transporter from "../utils/mailer";
import { ADMIN_EMAIL, MAIL_CONFIG } from "../utils/constant";

const LOG_DIR = path.join(__dirname, "logs");
const LOG_PATH = path.join(LOG_DIR, "errors.log");
const ROTATED_PATH = `${LOG_PATH}.sending`;

interface ErrorEntry {
  message?: string;
  stack?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  timestamp?: string;
  raw?: string;
}

function parseEntries(content: string): ErrorEntry[] {
  return content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        return JSON.parse(line) as ErrorEntry;
      } catch {
        return { raw: line };
      }
    });
}

function groupByMessage(entries: ErrorEntry[]) {
  const groups = new Map<
    string,
    { entry: ErrorEntry; count: number; last: string }
  >();

  for (const entry of entries) {
    const key = entry.message ?? entry.raw ?? "unknown error";
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.last = entry.timestamp ?? existing.last;
    } else {
      groups.set(key, { entry, count: 1, last: entry.timestamp ?? "" });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

function buildEmailHtml(entries: ErrorEntry[]): string {
  const grouped = groupByMessage(entries);

  const rows = grouped
    .map(({ entry, count, last }) => {
      const escapedMessage = (entry.message ?? entry.raw ?? "Unknown error")
        .toString()
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const escapedStack = entry.stack
        ? entry.stack.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;")
        : "";

      return `
        <div style="margin-bottom:16px;padding:12px;border:1px solid #e2e2e2;border-radius:6px;">
          <div style="display:flex;justify-content:space-between;">
            <strong style="color:#b91c1c;">${escapedMessage}</strong>
            <span style="background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:12px;font-size:12px;">
              x${count}
            </span>
          </div>
          <div style="color:#555;font-size:13px;margin-top:4px;">
            ${entry.method ?? ""} ${entry.path ?? ""} — status ${entry.statusCode ?? ""}
          </div>
          <div style="color:#999;font-size:12px;margin-top:4px;">
            Last seen: ${last}
          </div>
          ${
            escapedStack
              ? `<pre style="background:#f7f7f7;padding:8px;border-radius:4px;font-size:11px;overflow-x:auto;margin-top:8px;">${escapedStack}</pre>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  return `
    <h2>Error Digest — ${entries.length} error(s), ${grouped.length} unique</h2>
    ${rows}
  `;
}

async function sendEmail(html: string, totalCount: number) {
  await transporter.sendMail({
    from: MAIL_CONFIG.sender,
    to: ADMIN_EMAIL,
    subject: `[${process.env.APP_NAME ?? "App"}] Error Digest — ${totalCount} error(s)`,
    html,
  });
}

export async function sendErrorDigest() {
  if (!existsSync(LOG_PATH)) {
    console.info("No error log found, nothing to send.");
    return;
  }

  // Atomic rename so new errors written during this run go to a fresh
  // errors.log instead of being lost or double-read.
  try {
    await fs.rename(LOG_PATH, ROTATED_PATH);
  } catch (err) {
    console.error(
      "[cron] could not rotate error log (maybe already running):",
      err,
    );
    return;
  }

  const content = (await fs.readFile(ROTATED_PATH, "utf-8")).trim();

  if (!content) {
    await fs.unlink(ROTATED_PATH);
    console.info("Error log was empty, nothing to send.");
    return;
  }

  const entries = parseEntries(content);

  try {
    const html = buildEmailHtml(entries);
    await sendEmail(html, entries.length);
    await fs.unlink(ROTATED_PATH);
    console.info(
      `sendErrorDigest job completed — sent ${entries.length} error(s)`,
    );
  } catch (err) {
    console.error(
      "[cron] failed to send error digest, restoring entries for next run:",
      err,
    );

    // Merge back: rotated content (older) + anything written to LOG_PATH
    // since we rotated (newer), so nothing is lost.
    const newlyWritten = existsSync(LOG_PATH)
      ? await fs.readFile(LOG_PATH, "utf-8")
      : "";
    await fs.writeFile(LOG_PATH, content + "\n" + newlyWritten);
    await fs.unlink(ROTATED_PATH);
  }
}
