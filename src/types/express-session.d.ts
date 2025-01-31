import session from 'express-session';

// First, declare the session types
declare module 'express-session' {
    interface SessionData {
        token?: string;
        userId: number;
        role?: string;
        patientId?: number;
        doctorId?: number;
    }
}

declare global {
    namespace Express {
        interface Request {
            session: session.Session & session.SessionData;
        }
    }
}