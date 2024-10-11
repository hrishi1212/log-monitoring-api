import cluster from "cluster";
import os from "os";
import express from "express";
import config from "config";

import logRoutes from "./routes/logRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
const port: number = config.get<number>("port") || 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Routes
app.use("/logs", logRoutes);

// Error handling middleware
app.use(errorHandler as unknown as express.RequestHandler);

// Function to start the server
const startServer = () => {
  app.listen(port, () => {
    console.log(`Log monitoring API is running on http://localhost:${port}`);
  });
};

// Check if we are in Primary mode
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;

  console.log(`Primary ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Monitor for worker exit
  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`
    );
  });
} else {
  startServer();
  console.log(`Worker ${process.pid} started`);
}
