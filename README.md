# log-monitoring-api

Customizable REST API that allows users to retrieve logs from multiple Unix-based servers without the need for manual logins to each machine.

### Overview

This API provides a mechanism to retrieve log entries from a specified log file. It can fetch logs from both a primary server and a set of secondary servers, depending on the query parameters provided.

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
