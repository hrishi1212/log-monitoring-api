import { Router, Request, Response, NextFunction } from "express";
import { retrieveLogs } from "../services/logService";
import { BadRequestError } from "../errors/customError"; // Custom errors
import config from "config";

const router = Router();
const SECONDARY_SERVERS: Array<string> =
  config.get<Array<string>>("secondaryServers");

/**
 * Retrieves log entries based on the provided query parameters.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next middleware function.
 * @returns A JSON response containing the retrieved log entries.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, entries, keyword, fetchFromSecondary } = req.query;

    if (!filename) {
      return next(new BadRequestError("Filename is required"));
    }

    if (entries && isNaN(Number(entries))) {
      return next(new BadRequestError("'entries' must be a number"));
    }

    const primaryLogs = await retrieveLogs(
      filename as string,
      keyword as string | undefined,
      entries ? parseInt(entries as string, 10) : undefined
    );

    let combinedLogs = [...primaryLogs];

    if (fetchFromSecondary && fetchFromSecondary === "true") {
      const secondaryLogs = await Promise.allSettled(
        SECONDARY_SERVERS.map((secondaryServer) =>
          fetch(
            `${secondaryServer}?filename=${filename}&entries=${entries}&keyword=${keyword}`
          )
            .then((response) => response.json())
            .then((data) => data.logs)
        )
      );

      const secondaryLogsArray = secondaryLogs
        .filter((log) => log.status === "fulfilled")
        .map((result) => (result as PromiseFulfilledResult<any>).value);

      combinedLogs = [...combinedLogs, ...secondaryLogsArray.flat()];
      res.status(200).json({ filename, logs: combinedLogs });
      return;
    }

    res.status(200).json({ filename, logs: combinedLogs });
  } catch (error: any) {
    return next(error);
  }
});

export default router;
