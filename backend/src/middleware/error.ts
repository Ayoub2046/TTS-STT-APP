import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ success: false, message: err.message });
    return;
  }
  console.error("[error]", err);
  res.status(500).json({ success: false, message: "Internal server error." });
}

export function notFoundHandler(req: Request, res: Response): void {
  console.warn(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}