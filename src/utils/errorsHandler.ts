import { Request, Response, NextFunction } from 'express';
import AppError from 'utils/appError';
import logger from 'utils/logger';

const handleDBcastError = (err: any) => {
  const message = `Invalid ${err.path} value of ${err.value}.`;
  return new AppError(message, 400); // 400: bad request;
};

const handleDBduplicateFields = (err: any) => {
  const value = Object.values(err.keyValue)[0]; // extract the field name
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate value: "${value}" in the field: "${field}". Please use a different value!`;
  return new AppError(message, 409); // 409: conflict
};

const handleDBvalidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400); // 400: bad request;
};

const handleJWTError = () =>
  new AppError('Invalid token. Please try to login again', 401);

const handleJWTExpiredError = () =>
  new AppError('Token Expired. Please try to login again', 401);

const sendErrorDev = (err: any, req: Request, res: Response) => {
  if (req.originalUrl.startsWith('/api')) {
    //DEV: API
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    //DEV: RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      titel: 'Something went wrong',
      msg: err.message,
    });
  }
};

const sendErrorProd = (error: any, req: Request, res: Response) => {
  //Operational, trusted error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    // PROD: API
    if (error.isOperational) {
      logger.error('Operational Error:', error.message);
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
      //programming or other uknown error: don't leak error details
    } else {
      logger.error('Programming Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  } else {
    // PROD: RENDERED WEBSITE
    res.status(error.statusCode).render('error', {
      titel: 'Something went wrong',
      msg: 'Something went wrong! \n Please try again later.',
    });
  }
};

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // logger.info(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') {
      error = handleDBcastError(error);
    }
    if (Number(err.code) === 11000) {
      error = handleDBduplicateFields(error);
    }
    if (err.name === 'ValidationError') {
      error = handleDBvalidationError(error);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, req, res);
  }
  next();
};

export default errorHandler;
