import type { Request, Response, NextFunction } from 'express';

interface iFunction {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

const catchAsync = (fn: iFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return fn(req, res, next).catch(next);
  };
};

export default catchAsync;
