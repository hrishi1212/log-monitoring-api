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
 */
export const retrieveLogs = async (
  filename: string,
  keyword?: string,
  maxEntries?: number
): Promise<string[]> => {
  const filePath = path.join(LOG_DIR, filename);
  const logEntries: string[] = [];

  try {
    const fileSize = getFileSize(filePath);
    const fd = await open(filePath, "r");

    await readLogFile(fd, fileSize, keyword, maxEntries, logEntries);

    if (keyword && logEntries.length === 0) {
      throw new InvalidParameterError(`No log entries found matching the keyword "${keyword}"`);
    }

    await fd.close();
    return logEntries;
  } catch (err: any) {
    return handleErrors(err, filename);
  }
};

/**
 * Gets the size of the log file.
 */
const getFileSize = (filePath: string): number => {
  const fileStat = statSync(filePath);
  return fileStat.size;
};

/**
 * Reads the log file in reverse order, processing chunks and filtering by keyword.
 */
const readLogFile = async (
  fd: any,
  fileSize: number,
  keyword: string | undefined,
  maxEntries: number | undefined,
  logEntries: string[]
) => {
  const CHUNK_SIZE = getDynamicChunkSize();
  let position = fileSize;
  let buffer = Buffer.alloc(CHUNK_SIZE);
  let lineBuffer = "";

  while (position > 0 && (!maxEntries || logEntries.length < maxEntries)) {
    const bytesToRead = Math.min(CHUNK_SIZE, position);
    position -= bytesToRead;

    const chunk = await readChunk(fd, buffer, bytesToRead, position);
    lineBuffer = chunk + lineBuffer;

    const lines = lineBuffer.split(/\r?\n/);

    processLogLines(lines, keyword, logEntries, maxEntries);
  }
};

/**
 * Reads a chunk of data from the file at a given position.
 */
const readChunk = async (
  fd: any,
  buffer: Buffer,
  bytesToRead: number,
  position: number
): Promise<string> => {
  const { bytesRead } = await fd.read(buffer, 0, bytesToRead, position);
  return buffer.toString("utf-8", 0, bytesRead);
};


/**
 * Processes log lines and filters them based on the keyword.
 */
const processLogLines = (
  lines: string[],
  keyword: string | undefined,
  logEntries: string[],
  maxEntries: number | undefined
) => {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line && (!keyword || line.includes(keyword))) {
      logEntries.push(line);
      if (maxEntries && logEntries.length >= maxEntries) {
        break;
      } 
    }
  }
};

/**
 * Handles specific error cases and rethrows unexpected errors.
 */
const handleErrors = (err: any, filename: string) => {
  if (err.code === "ENOENT") {
    throw new NotFoundError(`Log file "${filename}" not found on server`);
  }
  throw err;
};