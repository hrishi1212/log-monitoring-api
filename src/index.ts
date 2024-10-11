import express from "express";
import logRoutes from "./routes/logRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
const port = 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Routes
app.use("/logs", logRoutes);

// Error handling middleware
app.use(errorHandler as unknown as express.RequestHandler);

// Start the server
app.listen(port, () => {
  console.log(`Log monitoring API is running on http://localhost:${port}`);
});
