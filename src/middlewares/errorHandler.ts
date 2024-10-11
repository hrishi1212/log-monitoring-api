import { Request, Response, NextFunction } from "express";
import { CustomError } from "../errors/customError";

/**
 * Middleware function to handle errors in the application.
 *
 * This middleware function is responsible for handling any errors that occur in the application. It logs the error stack to the console and then sends a JSON response with the appropriate status code and error message.
 *
 * If the error is an instance of `CustomError`, it will send a JSON response with the status code and error messages from the `CustomError` instance. Otherwise, it will send a generic 500 Internal Server Error response.
 *
 * @param err - The error object that was thrown.
 * @param _ - The Express request object (not used).
 * @param res - The Express response object.
 * @param __ - The Express next function (not used).
 */
export const errorHandler = (
  err: any,
  _: Request,
  res: Response,
  __: NextFunction
) => {
  console.error(err.stack);
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ errors: err.serializeErrors() });
  }

  return res.status(500).json({ error: "Something went wrong!" });
};
