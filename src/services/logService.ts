import { createReadStream } from "fs";
import config from "config";
import * as path from "path";
import { createInterface } from "readline";
import { NotFoundError, InvalidParameterError } from "../errors/customError";

const LOG_DIR: string = config.get<string>("logDir");
/**
 * Retrieves log entries from a file, with optional filtering by keyword and limiting the number of entries.
 *
 * @param filename - The name of the log file to retrieve entries from.
 * @param keyword - (Optional) A keyword to filter the log entries by.
 * @param entries - (Optional) The maximum number of log entries to retrieve.
 * @returns An array of log entry strings.
 * @throws {NotFoundError} If the specified log file is not found.
 * @throws {InvalidParameterError} If the provided keyword matches too many entries or no entries are found.
 */
export const retrieveLogs = async (
  filename: string,
  keyword?: string,
  entries?: number
): Promise<string[]> => {
  try {
    const filePath = path.join(LOG_DIR, filename);

    let fileStream;
    fileStream = createReadStream(filePath, { encoding: "utf-8" });

    // Create a line-by-line stream
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let logEntries: string[] = [];

    // Process the file line by line
    for await (const line of rl) {
      const trimmedLine = line.trim();
      if (trimmedLine === "") {
        continue;
      }

      // If a keyword is provided, only include lines that contain the keyword
      if (keyword) {
        if (trimmedLine.includes(keyword)) {
          logEntries.push(trimmedLine);
        }
      } else {
        logEntries.push(trimmedLine); // If no keyword, add all lines
      }
    }

    // If a keyword is provided and no matching entries are found
    if (keyword && logEntries.length === 0) {
      throw new InvalidParameterError(
        `No log entries found matching the keyword "${keyword}"`
      );
    }

    // If more than 1000 keyword matches, consider it too broad
    if (keyword && logEntries.length > 1000) {
      throw new InvalidParameterError(
        `The keyword "${keyword}" is too broad and matches too many entries`
      );
    }

    // Reverse to get newest logs first
    logEntries.reverse();

    // Apply entries limit if provided
    if (entries && entries > 0) {
      logEntries = logEntries.slice(-entries);
    }

    return logEntries;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new NotFoundError(`Log file "${filename}" not found on server`);
    }
    throw err;
  }
};
