import express from "express";
import logRoutes from "./routes";

const app = express();
const port = 3000;

// Middleware for parsing JSON bodies (if needed)
app.use(express.json());

// Routes
app.use("/logs", logRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction
  ) => {
    console.error(err.stack);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Log monitoring API is running on http://localhost:${port}`);
});
