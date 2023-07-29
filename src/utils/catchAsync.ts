import type { Request, Response, NextFunction } from 'express';

const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return fn(req, res, next).catch(next);
  };
};

export default catchAsync;
