import { Request, Response, NextFunction } from "express";
import { CustomError } from "./customError";

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
