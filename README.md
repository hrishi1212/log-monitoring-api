# log-monitoring-api

Customizable REST API that allows users to retrieve logs from multiple Unix-based servers without the need for manual logins to each machine.

### Overview

This API provides a mechanism to retrieve log entries from a specified log file. It can fetch logs from both a primary server and a set of secondary servers, depending on the query parameters provided.

### Design

[Design Document](https://drive.google.com/file/d/16rfGVuc2nnMT5jlkeX8n_vGIDsCr-8o6/view) - Overview of the API flow and approach taken.

### Key Optimizations
- Reverse File Reading: We read the file in reverse by seeking chunks from the end, making it faster to retrieve the most recent log entries.
- Memory Efficiency: Instead of loading the entire file into memory, we process the file in small chunks (dynamic memory allocation by server), which keeps memory usage low.
- Dynamic memory allocation: By adapting the chunk size based on available system memory, you can avoid loading more data into memory than the system can handle. If there's ample memory, using larger chunks can reduce the number of I/O operations, which may improve file read throughput.
- Keyword Filtering: Filtering is applied as the lines are processed, ensuring we only keep relevant logs.
- Entry Limiting: The loop breaks once the required number of log entries (entries) is found, further reducing unnecessary processing.

## Performance Considerations
- Concurrency: If the system needs to process multiple log files concurrently, combining this approach with clustering which is already been used here or worker threads can further improve throughput.
- Avoiding I/O Blocking: The use of asynchronous file handling (fs/promises) ensures that the file reading operations do not block the event loop.

### Installation

- Clone the repository:

```bash
git clone https://github.com/hrishi1212/log-monitoring-api.git
```

- Navigate to the project directory:

```bash
cd log-monitoring-api
```

- Install the required dependencies:

```bash
npm install
```

- Start the server:

```bash
npm run start
```

- Test API with unit tests

```bash
npm run test
```

- Test API with UI
  navigate to `http://localhost:3000` and perform text base search.

- The server will start running on `http://localhost:3000`.

### UI Documentation

## UI Endpoint

`http://localhost:3000`

## Base URL

`http://localhost:3000/logs`

### Endpoint

## `GET /logs`

Retrieves log entries based on the specified parameters.

#### Query Parameters

| Parameter            | Type    | Required | Description                                                                            |
| -------------------- | ------- | -------- | -------------------------------------------------------------------------------------- |
| `filename`           | string  | Yes      | The name of the log file from which to retrieve entries.                               |
| `entries`            | number  | No       | The maximum number of log entries to retrieve.                                         |
| `keyword`            | string  | No       | A keyword to filter the log entries.                                                   |
| `fetchFromSecondary` | boolean | No       | A flag to determine whether to fetch logs from secondary servers. Defaults to `false`. |

#### Responses

- **200 OK**: Returns the log entries successfully.

  **Response Format**:

  ```json
  {
    "filename": "test.log",
    "logs": [
      "Primary log 1",
      "Primary log 2",
      "Secondary log 1",
      "Secondary log 2",
      "Secondary log 3"
    ]
  }
  ```

### Example Requests

## Example 1: Fetch logs from the primary server

`GET /logs?filename=syslog.log`

## Example 2: Fetch logs from with filtering

`GET /logs?filename=syslog.log&entries=2&keyword=error`

## Example 3: Fetch logs from secondary servers

`GET /logs?filename=test.log&fetchFromSecondary=true`

### Configuration

- To pass the log file directory while testing or in any environment please modify the `config/${env}.json` file.
- To pass the port number while testing please modify the `config/${env}.json` file.
