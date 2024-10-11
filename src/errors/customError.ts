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

export class InvalidKeywordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidKeywordError";
  }
}

export class NoLogEntriesFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoLogEntriesFoundError";
  }
}

export class KeywordTooBroadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeywordTooBroadError";
  }
}
