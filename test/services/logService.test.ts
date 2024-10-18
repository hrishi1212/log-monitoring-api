import { statSync } from 'fs';
import { open } from 'fs/promises';
import * as config from 'config';
import * as os from 'os';
import * as path from 'path';

import { CustomError } from "../../src/errors/customError";
import { retrieveLogs } from "../../src/services/logService";

jest.mock('fs', () => ({
  statSync: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  open: jest.fn(),
}));
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
jest.mock('os', () => ({
  freemem: jest.fn(),
}));

describe('retrieveLogs', () => {
  const mockLogDir = "../test/test-log-files";
  const mockFileName = "test.log";
  const mockFilePath = path.join(mockLogDir, mockFileName);

  beforeEach(() => {
    jest.clearAllMocks();
    (config.get as jest.Mock).mockReturnValue(mockLogDir);
  });

  it('should throw NotFoundError if the file does not exist', async () => {
    // Mock statSync to throw ENOENT error
    (statSync as jest.Mock).mockImplementation(() => {
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      throw error;
    });

    await expect(retrieveLogs(mockFileName)).rejects.toThrow(CustomError);
    expect(statSync).toHaveBeenCalledWith(mockFilePath);
  });

  it('should throw InvalidParameterError if no log entries match the keyword', async () => {
    // Mock statSync to return a fake file size
    (statSync as jest.Mock).mockReturnValue({ size: 1024 });
    // Mock freemem to return a large amount of memory
    (os.freemem as jest.Mock).mockReturnValue(100 * 1024 * 1024); // 100MB
    // Mock open and file read behavior
    const mockFd = {
      read: jest.fn().mockResolvedValueOnce({ bytesRead: 512 }),
      close: jest.fn().mockResolvedValueOnce(undefined),
    };
    (open as jest.Mock).mockResolvedValue(mockFd);

    const mockLogContent = "log line 1\nlog line 2\nlog line 3\n";
    (mockFd.read as jest.Mock).mockResolvedValueOnce({
      bytesRead: mockLogContent.length,
      buffer: Buffer.from(mockLogContent),
    });

    await expect(retrieveLogs(mockFileName, 'non-existent-keyword')).rejects.toThrow("No log entries found matching the keyword \"non-existent-keyword\"");
  });

  it('should return log entries that match the keyword', async () => {
    // Mock statSync to return a fake file size
    (statSync as jest.Mock).mockReturnValue({ size: 49 });
    // Mock freemem to return a large amount of memory
    (os.freemem as jest.Mock).mockReturnValue(100 * 1024 * 1024); // 100MB
    // Mock open and file read behavior
    const mockLogContent = "Log entry 1\nLog entry 2 with keyword\nLog entry 3\n";

    const mockFd = {
      read: jest.fn().mockImplementation((buffer, offset, length, __) => {
        // Populate the buffer with mock content
        const contentBuffer = Buffer.from(mockLogContent);
        contentBuffer.copy(buffer, offset, 0, length);
        return Promise.resolve({
          bytesRead: contentBuffer.length,
          buffer,
        });
      }),
      close: jest.fn().mockResolvedValueOnce(undefined),
    };
    (open as jest.Mock).mockResolvedValue(mockFd);

    const logs = await retrieveLogs(mockFileName, 'keyword', 2);
    expect(logs).toEqual(['Log entry 2 with keyword']);
  });

  it('should read the correct number of log entries when no keyword is provided', async () => {
    // Mock statSync to return a fake file size
    (statSync as jest.Mock).mockReturnValue({ size: 49 });

    // Mock freemem to return a large amount of memory
    (os.freemem as jest.Mock).mockReturnValue(100 * 1024 * 1024); // 100MB

    const mockLogContent = "Log entry 1\nLog entry 2\nLog entry 3\n";

    const mockFd = {
      read: jest.fn().mockImplementation((buffer, offset, length, __) => {
        const contentBuffer = Buffer.from(mockLogContent);
        contentBuffer.copy(buffer, offset, 0, length);
        return Promise.resolve({
          bytesRead: contentBuffer.length,
          buffer,
        });
      }),
      close: jest.fn().mockResolvedValueOnce(undefined),
    };
    (open as jest.Mock).mockResolvedValue(mockFd);

    const logs = await retrieveLogs(mockFileName, undefined, 2);
    expect(logs).toEqual(['Log entry 3', 'Log entry 2']);
  });

  it('should dynamically calculate chunk size based on free memory', async () => {
    // Mock statSync to return a fake file size
    (statSync as jest.Mock).mockReturnValue({ size: 1024 });
    // Mock freemem to return a small amount of memory
    (os.freemem as jest.Mock).mockReturnValue(64 * 1024 * 1024); // 64MB
    // Mock open and file read behavior
    const mockFd = {
      read: jest.fn().mockResolvedValueOnce({ bytesRead: 512 }),
      close: jest.fn().mockResolvedValueOnce(undefined),
    };
    (open as jest.Mock).mockResolvedValue(mockFd);

    const mockLogContent = "log line 1\nlog line 2\nlog line 3\n";
    (mockFd.read as jest.Mock).mockResolvedValueOnce({
      bytesRead: mockLogContent.length,
      buffer: Buffer.from(mockLogContent),
    });

    await retrieveLogs(mockFileName);
    expect(os.freemem).toHaveBeenCalled();
  });
});