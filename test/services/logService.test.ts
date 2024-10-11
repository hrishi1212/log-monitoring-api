import { createReadStream } from "fs";
import config from "config";
import { createInterface } from "readline";
import { retrieveLogs } from "../../src/services/logService";
import { CustomError } from "../../src/errors/customError";

jest.mock("fs");
jest.mock("config", () => ({
  get: jest.fn((key) => {
    switch (key) {
      case "logDir":
        return "../test/test-log-files";
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
  const logDir = "../test/test-log-files";

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

    await expect(retrieveLogs(filename)).rejects.toThrow(CustomError);
  });

  it("should throw Error for no matching keyword", async () => {
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
      CustomError
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

    expect(result).toEqual(["Second log entry", "First log entry"]);
  });
});
