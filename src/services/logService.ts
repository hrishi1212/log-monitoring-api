import { statSync } from "fs";
import config from "config";
import * as path from "path";
import * as os from 'os';
import { InvalidParameterError, NotFoundError } from "../errors/customError";
import { open } from "fs/promises";

const LOG_DIR: string = config.get<string>("logDir");

/**
 * This function calculates the chunk size based on 1% of the free system memory. 
 * The chunk size is capped between a minimum of 64KB and a maximum of 256KB.
 * we can adjust these limits based on your use case and performance testing.
 * @returns chunk size in bytes
 */
const getDynamicChunkSize = (): number => {
  // get free from system
  const freeMemory = os.freemem();
  const chunkSize = Math.min(Math.max(freeMemory * 0.01, 64 * 1024), 256 * 1024); 
  return Math.floor(chunkSize);
};


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

    // Check if the file exists and get its size
    const fileStat = statSync(filePath);
    let position = fileStat.size;

    // Define the chunk size for reading in reverse, get it dynamically by system resource
    const CHUNK_SIZE = getDynamicChunkSize();
    const fd = await open(filePath, 'r');
   
    let buffer = Buffer.alloc(CHUNK_SIZE);

    let logEntries: string[] = [];
    let lineBuffer = '';

    // Read the file in reverse
    while (position > 0 && (!entries || logEntries.length < entries)) {
      const bytesToRead = Math.min(CHUNK_SIZE, position);
      position -= bytesToRead;

      // Read the chunk
      const { bytesRead } = await fd.read(buffer, 0, bytesToRead, position);

      // Split the chunk into lines and append to lineBuffer
      const chunk = buffer.toString('utf-8', 0, bytesRead);
      lineBuffer = chunk + lineBuffer;

      const lines = lineBuffer.split(/\r?\n/);

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();

        // Filter based on the keyword if provided
        if (line && (!keyword || line.includes(keyword))) {
          logEntries.push(line);

          // Stop if we have the required number of entries
          if (entries && logEntries.length >= entries) {
            break;
          }
        }
      }
    }

    // Throw an error if keyword is provided and no matching entries are found
    if (keyword && logEntries.length === 0) {
      throw new InvalidParameterError(`No log entries found matching the keyword "${keyword}"`);
    }
    
    await fd.close();

    return logEntries;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new NotFoundError(`Log file "${filename}" not found on server`);
    }
    throw err;
  }
};
