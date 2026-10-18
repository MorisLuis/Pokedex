import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors.js';
import type { ErrorResponse } from '../types.js';

export const errorMiddleware: ErrorRequestHandler<Record<string, string>, ErrorResponse> = (error: unknown, req, res, next) => {
  
  if (res.headersSent) { 
    return next(error); 
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: {
      code: 'INVALID_REQUEST',
      message: `Invalid request parameters: ${[...new Set(error.issues.map((issue) => issue.path.join('.') || 'query'))].join(', ')}`,
    } });
    return;
  }

  if (error instanceof URIError) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Invalid URL encoding' } });
    return;
  }

  const failure = error instanceof AppError ? error : new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred', { cause: error });

  if (failure.status >= 500) console.error(`${req.method} ${req.path} failed`, failure);

  res.status(failure.status).json({ error: { code: failure.code, message: failure.message } });
};
