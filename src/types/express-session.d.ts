import session from 'express-session';

// First, declare the session types
declare module 'express-session' {
    interface SessionData {
        token?: string;
    }
}

declare global {
    namespace Express {
        interface Request {
            session: session.Session & Partial<session.SessionData>;
        }
    }
}