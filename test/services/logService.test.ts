import { createReadStream } from "fs";
import config from "config";
import { createInterface } from "readline";
import { retrieveLogs } from "../../src/services/logService";
import {
  NotFoundError,
  InvalidParameterError,
} from "../../src/errors/customError";

jest.mock("fs");
jest.mock("config", () => ({
  get: jest.fn((key) => {
    switch (key) {
      case "logDir":
        return "../test/test_log_files"; // Mock logDir value for tests
      default:
        throw new Error(`Config key "${key}" is not defined.`);
    }
  }),
}));
jest.mock("readline");

const mockCreateReadStream = createReadStream as jest.Mock;
const mockCreateInterface = createInterface as jest.Mock;

describe("retrieveLogs", () => {
  const filename = "test.log";
  const logDir = "../test/test_log_files";

  beforeAll(() => {
    (config.get as jest.Mock).mockReturnValue(logDir);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should read log entries without keyword", async () => {
    const mockLogEntries =
      "First log entry\nSecond log entry\n\nThird log entry\n";
    const mockReadStream = {
      [Symbol.asyncIterator]: jest.fn().mockReturnValue({
        next: jest
          .fn()
          .mockResolvedValueOnce({ value: "First log entry\n", done: false })
          .mockResolvedValueOnce({ value: "Second log entry\n", done: false })
          .mockResolvedValueOnce({ value: "Third log entry\n", done: false })
          .mockResolvedValue({ done: true }),
      }),
    };

    mockCreateReadStream.mockReturnValue(mockReadStream);
    mockCreateInterface.mockReturnValue(mockReadStream);

    const result = await retrieveLogs(filename);

    expect(result).toEqual([
      "Third log entry",
      "Second log entry",
      "First log entry",
    ]);
  });

  it("should filter log entries by keyword", async () => {
    const mockLogEntries =
      "First log entry\nSecond log entry\n\nThird log entry\n";
    const mockReadStream = {
      [Symbol.asyncIterator]: jest.fn().mockReturnValue({
        next: jest
          .fn()
          .mockResolvedValueOnce({ value: "First log entry\n", done: false })
          .mockResolvedValueOnce({ value: "Second log entry\n", done: false })
          .mockResolvedValueOnce({ value: "Third log entry\n", done: false })
          .mockResolvedValue({ done: true }),
      }),
    };

    mockCreateReadStream.mockReturnValue(mockReadStream);
    mockCreateInterface.mockReturnValue(mockReadStream);

    const result = await retrieveLogs(filename, "First");

    expect(result).toEqual(["First log entry"]);
  });

  it("should throw NotFoundError if file does not exist", async () => {
    mockCreateReadStream.mockImplementation(() => {
      throw { code: "ENOENT" };
    });

    await expect(retrieveLogs(filename)).rejects.toThrow(NotFoundError);
  });

  it("should throw InvalidParameterError for no matching keyword", async () => {
    const mockReadStream = {
      [Symbol.asyncIterator]: jest.fn().mockReturnValue({
        next: jest
          .fn()
          .mockResolvedValueOnce({ value: "First log entry\n", done: false })
          .mockResolvedValueOnce({ value: "Second log entry\n", done: false })
          .mockResolvedValue({ done: true }),
      }),
    };

    mockCreateReadStream.mockReturnValue(mockReadStream);
    mockCreateInterface.mockReturnValue(mockReadStream);

    await expect(retrieveLogs(filename, "Nonexistent")).rejects.toThrow(
      InvalidParameterError
    );
  });

  it("should throw InvalidParameterError if keyword matches too many entries", async () => {
    const mockLogEntries = "Log entry 1\nLog entry 2\n"; // Add enough entries for the test
    const mockReadStream = {
      [Symbol.asyncIterator]: jest.fn().mockReturnValue({
        next: jest
          .fn()
          .mockResolvedValueOnce({ value: "Log entry 1\n", done: false })
          .mockResolvedValueOnce({ value: "Log entry 2\n", done: false })
          .mockResolvedValue({ done: true }),
      }),
    };

    mockCreateReadStream.mockReturnValue(mockReadStream);
    mockCreateInterface.mockReturnValue(mockReadStream);

    await expect(retrieveLogs(filename, "Log")).rejects.toThrow(
      InvalidParameterError
    );
  });

  it("should limit log entries when entries parameter is passed", async () => {
    const mockReadStream = {
      [Symbol.asyncIterator]: jest.fn().mockReturnValue({
        next: jest
          .fn()
          .mockResolvedValueOnce({ value: "First log entry\n", done: false })
          .mockResolvedValueOnce({ value: "Second log entry\n", done: false })
          .mockResolvedValueOnce({ value: "Third log entry\n", done: false })
          .mockResolvedValue({ done: true }),
      }),
    };

    mockCreateReadStream.mockReturnValue(mockReadStream);
    mockCreateInterface.mockReturnValue(mockReadStream);

    const result = await retrieveLogs(filename, undefined, 2);

    expect(result).toEqual(["Third log entry", "Second log entry"]);
  });
});
