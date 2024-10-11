import request from "supertest";
import express from "express";
import config from "config";

import logRouter from "../../src/routes/logRoutes";
import { retrieveLogs } from "../../src/services/logService";
import { errorHandler } from "../../src/middlewares/errorHandler";

jest.mock("../../src/services/logService", () => ({
  retrieveLogs: jest.fn(),
}));

const SECONDARY_SERVERS = [
  "http://secondary-server1.com/logs",
  "http://secondary-server2.com/logs",
];

const app = express();
app.use(express.json());
app.use("/logs", logRouter);
app.use(errorHandler as unknown as express.RequestHandler);

describe("GET /logs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if filename is missing", async () => {
    const response = await request(app).get("/logs").query({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: [{ message: "Filename is required" }],
    });
  });

  it("should return 400 if entries is not a valid number", async () => {
    const response = await request(app).get("/logs").query({
      filename: "logfile.log",
      entries: "not_a_number",
    });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: [{ message: "'entries' must be a number" }],
    });
  });

  it("should return log from primary server entries with valid filename and parameters", async () => {
    const mockLogs = ["Log entry 1", "Log entry 2"];

    // Mock the implementation of retrieveLogs
    (retrieveLogs as jest.Mock).mockResolvedValue(mockLogs);

    const response = await request(app).get("/logs").query({
      filename: "logfile.log",
      keyword: "error",
      entries: "2",
    });

    expect(response.status).toBe(200);
    expect(retrieveLogs).toHaveBeenCalledWith("logfile.log", "error", 2);
    expect(response.body).toEqual({
      filename: "logfile.log",
      logs: mockLogs,
    });
  });

  it("should fetch logs from the primary server and return combined logs from secondary servers", async () => {
    const mockPrimaryLogs = ["Primary log 1", "Primary log 2"];
    const mockSecondaryLogs1 = ["Secondary log 1"];
    const mockSecondaryLogs2 = ["Secondary log 2", "Secondary log 3"];

    (retrieveLogs as jest.Mock).mockResolvedValue(mockPrimaryLogs);

    // Mock fetch for secondary servers
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ logs: mockSecondaryLogs1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ logs: mockSecondaryLogs2 }),
      });

    const response = await request(app)
      .get("/logs")
      .query({ filename: "test.log", fetchFromSecondary: "true" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      filename: "test.log",
      logs: [...mockPrimaryLogs, ...mockSecondaryLogs1, ...mockSecondaryLogs2],
    });
  });

  it("should handle errors thrown by retrieveLogs", async () => {
    (retrieveLogs as jest.Mock).mockRejectedValue(
      new Error("Something went wrong")
    );

    const response = await request(app).get("/logs").query({
      filename: "logfile.log",
      entries: "10",
    });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Something went wrong!" });
  });
});
