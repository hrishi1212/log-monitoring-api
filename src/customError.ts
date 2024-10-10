export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    // Maintains proper stack trace (only on V8 environments)
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

export class UnauthorizedError extends CustomError {
  constructor(message: string = "Not authorized") {
    super(message, 401);
  }
}
