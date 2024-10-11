/**
 * Represents a custom error with a status code.
 *
 * This class extends the built-in `Error` class and adds a `statusCode` property to
 * represent the HTTP status code associated with the error.
 *
 * The `serializeErrors()` method returns an array of error objects with a `message`
 * property, which can be used for serializing the error to a response.
 */
export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, CustomError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "Not found") {
    super(message, 404);
  }
}

export class InvalidParameterError extends CustomError {
  constructor(message: string) {
    super(message, 422);
  }
}
