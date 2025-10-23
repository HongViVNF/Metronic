import logger from './logger';

export class AppError extends Error {
  public errorCode: string | number;
  public statusCode: number;
  public status: 'fail' | 'error';
  public isOperational: boolean;

  constructor(message: string, errorCode: string | number, statusCode: number) {
    super(message);

    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    logger.error(`${this.stack}`);
  }
}
