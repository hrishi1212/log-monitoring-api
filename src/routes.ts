import { Router, Request, Response } from "express";

const router = Router();

// GET /logs?filename=syslog&entries=100&keyword=error
router.get("/", (req: Request, res: Response) => {
  const { filename } = req.query;
  // Implement the logic to retrieve log entries based on the query parameters
  try {
    res.status(200).json({ filename });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      res.status(404).json({ error: `Log file ${filename} not found` });
    } else {
      res
        .status(500)
        .json({ error: "Error retrieving log file", message: error.message });
    }
  }
});

export default router;
