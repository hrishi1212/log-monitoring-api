import * as fs from "fs";
import * as path from "path";

// Set the path and file name
const LOG_DIR = "/Users/hrishikeshkale/Desktop/logs"; // Change to your directory
const LOG_FILE = path.join(LOG_DIR, "large-log-file.log");

// Example log line (approx 100 bytes each)
const logEntry = `INFO [2024-10-10 12:00:00] Sample log message. Details about the event...\n`;

// Total size for 1GB in bytes
const TARGET_SIZE = 1 * 1024 * 1024; // 1GB

async function generateLogFile() {
  const stream = fs.createWriteStream(LOG_FILE, { flags: "w" });

  // Keep track of file size
  let currentSize = 0;

  console.log("Generating 1GB log file...");

  while (currentSize < TARGET_SIZE) {
    stream.write(logEntry);
    currentSize += Buffer.byteLength(logEntry);

    // Optional: Log progress every 100MB written
    if (currentSize % (100 * 1024 * 1024) === 0) {
      console.log(`Written ${currentSize / (1024 * 1024)} MB`);
    }
  }

  stream.end(() => {
    console.log("1GB log file created successfully.");
  });
}

generateLogFile().catch((error) => {
  console.error("Error generating log file:", error);
});
