// src/middleware/authenticate_JWT.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { StatusError } from '../utils/status_error';
import { PatientRepository } from '../app/patient/patient.repository';
import { DoctorRepository } from '../app/doctor/doctor.repository';
import Container from 'typedi';
import { UserType } from '../app/user/user.model';

dotenv.config();

// src/context/session_context.ts
import { Service } from 'typedi';

@Service()
export class SessionContext {
    userId?: number;
    role?: string;
    patientId?: number;
    doctorId?: number;

    setSessionData(userId: number, role: string, patientId?: number, doctorId?: number) {
        this.userId = userId;
        this.role = role;
        this.patientId = patientId;
        this.doctorId = doctorId;
    }
}

const publicRoutes = [
    '/login',
    '/register'
];

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    const path = req.path;
    if (publicRoutes.includes(path)) {
        return next();
    }

    try {
        await authenticateJWT(req, res, next);
        await validateUser(req, res, next);
    }
    catch (error) {
        next(error);
    }

    next();
}

export async function authenticateJWT(req: Request, _res: Response, _next: NextFunction) {
    const token = req.session.token;

    if (!token) {
        throw new StatusError(401, 'Access token is missing or invalid');
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err, _user) => {
        if (err) {
            throw new StatusError(403, 'Invalid token');
        }

        return;
    });
}

export async function validateUser(req: Request, _res: Response, _next: NextFunction) {
    const patientRepository = Container.get(PatientRepository);
    const doctorRepository = Container.get(DoctorRepository);
    const sessionContext = Container.get(SessionContext);

    const userId = req.session.userId;
    if (!userId) {
        throw new StatusError(401, 'User ID is missing');
    }

    // Check if the user is a patient or doctor
    const patient = await patientRepository.findByFields({ user_id: userId });
    const doctor = await doctorRepository.findByFields({ user_id: userId });

    if (patient) {
        sessionContext.setSessionData(userId, UserType.PATIENT, patient.id);
    } else if (doctor) {
        sessionContext.setSessionData(userId, UserType.DOCTOR, undefined, doctor.id);
    } else {
        sessionContext.setSessionData(userId, UserType.ADMIN);
    }

}