import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { StatusError } from '../utils/status_error';

dotenv.config();

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.session.token;

    if (!token) {
        return next(new StatusError(401, 'Access token is missing or invalid'));
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
        if (err) {
            return next(new StatusError(403, 'Invalid token'));
        }

        (req as any).user = user;
        next();
    });
};