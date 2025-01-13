// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { StatusError } from '../utils/status_error';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ error: 'Invalid JSON format' });
    } else if (err instanceof StatusError) {
        res.status(err.status).json({ error: err.message });
    } else {
        res.status(500).json({ error: 'Internal Server Error' });
        console.error(err);
    }
}