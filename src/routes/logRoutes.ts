import { Router, Request, Response, NextFunction } from "express";
import { retrieveLogs } from "../services/logService";
import { BadRequestError } from "../errors/customError"; // Custom errors

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  // Implement the logic to retrieve log entries based on the query parameters
  try {
    const { filename, entries, keyword } = req.query;

    if (!filename) {
      return next(new BadRequestError("Filename is required"));
    }

    if (entries && isNaN(Number(entries))) {
      return next(new BadRequestError("'entries' must be a number"));
    }

    const logs = await retrieveLogs(
      filename as string,
      keyword as string | undefined,
      entries ? parseInt(entries as string, 10) : undefined
    );
    res.status(200).json({ filename, logs });
  } catch (error: any) {
    return next(error);
  }
});

export default router;
