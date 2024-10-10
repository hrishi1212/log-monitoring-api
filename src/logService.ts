import { promises as fs } from "fs";
import * as path from "path";
import { NotFoundError } from "./customError";

const LOG_DIR = "/var/log"; // Assuming logs are in /var/log

// Function to retrieve logs with optional filtering and limiting
export const retrieveLogs = async (
  filename: string,
  keyword?: string,
  entries?: number
): Promise<string[]> => {
  const filePath = path.join(LOG_DIR, filename);

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (err) {
    throw new NotFoundError(`Log file ${filename} not found on server`);
  }

  // Read log file asynchronously
  const data = await fs.readFile(filePath, "utf-8");

  // Split the log file and remove empty lines
  let logEntries = data.split("\n").filter(Boolean);

  // If keyword is provided, filter log entries based on keyword
  if (keyword) {
    logEntries = logEntries.filter((line) => line.includes(keyword));
  }

  // Reverse log entries to get the newest logs first
  logEntries = logEntries.reverse();

  // Limit to the last 'n' entries (if provided)
  if (entries) {
    if (!isNaN(entries) && entries > 0) {
      logEntries = logEntries.slice(-entries);
    }
  }

  return logEntries;
};
