// Represents an operational application error.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
