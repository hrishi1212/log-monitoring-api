import { Router, Request, Response, NextFunction } from "express";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "./customError"; // Custom errors

const router = Router();

// GET /logs?filename=syslog&entries=100&keyword=error
router.get("/", async (req: Request, res: Response, __: NextFunction) => {
  const { filename, entries, keyword } = req.query;
  if (!filename) {
    throw new BadRequestError("Filename is required");
  }

  if (entries && isNaN(Number(entries))) {
    throw new BadRequestError("'entries' must be a number");
  }

  // Implement the logic to retrieve log entries based on the query parameters
  try {
    res.status(200).json({ filename, entries, keyword });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new NotFoundError(`Log file ${filename} not found`);
    } else {
      throw new InternalServerError(`Something went wrong: ${error.message}`);
    }
  }
});

// 404 Route Not Found Error (for unmatched routes)
router.all("*", (_: Request, __: Response, next: NextFunction) => {
  next(new NotFoundError("Route not found"));
});

export default router;
