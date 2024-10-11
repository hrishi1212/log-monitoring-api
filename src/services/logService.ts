import { promises as fs } from "fs";
import * as path from "path";
import {
  NotFoundError,
  InvalidKeywordError,
  NoLogEntriesFoundError,
  KeywordTooBroadError,
} from "../errors/customError";

const LOG_DIR = "/var/log"; // Assuming logs are in /var/log

// Function to retrieve logs with optional filtering and limiting
export const retrieveLogs = async (
  filename: string,
  keyword?: string,
  entries?: number
): Promise<string[]> => {
  const filePath = path.join(LOG_DIR, filename);

  // Attempt to read the file, throw an error if it does not exist
  let data: string;
  try {
    data = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    throw new NotFoundError(`Log file "${filename}" not found on server`);
  }

  // Split the log file and remove empty lines
  let logEntries = data.split("\n").filter(Boolean);

  // Validate and filter by keyword if provided
  if (keyword) {
    if (keyword.trim() === "") {
      throw new InvalidKeywordError("Keyword query is invalid or empty");
    }

    logEntries = logEntries.filter((line) => line.includes(keyword));

    // Handle no matching log entries
    if (logEntries.length === 0) {
      throw new NoLogEntriesFoundError(
        `No log entries found matching the keyword "${keyword}"`
      );
    }

    // Handle too broad keyword case (if more than 1000 matches)
    if (logEntries.length > 1000) {
      throw new KeywordTooBroadError(
        `The keyword "${keyword}" is too broad and matches too many entries`
      );
    }
  }

  // Reverse to get newest logs first
  logEntries.reverse();

  // Limit the log entries to the specified 'n' entries
  if (entries && entries > 0) {
    logEntries = logEntries.slice(-entries);
  }

  return logEntries;
};
