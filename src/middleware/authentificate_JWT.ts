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

const publicRoutes = [
    '/login',
    '/register',
    '/department',
    '/doctor',
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

    const userId = req.session.userId;
    if (!userId) {
        throw new StatusError(401, 'User ID is missing');
    }

    // Check if the user is a patient or doctor
    const patient = await patientRepository.findByFields({ user_id: userId });
    const doctor = await doctorRepository.findByFields({ user_id: userId });

    if (patient) {
        req.session.patientId = patient.id;
        req.session.role = UserType.PATIENT;
        req.session.doctorId = undefined;
    } else if (doctor) {
        req.session.doctorId = doctor.id;
        req.session.role = UserType.DOCTOR;
        req.session.patientId = undefined;
    } else {
        req.session.patientId = undefined;
        req.session.role = UserType.ADMIN;
        req.session.doctorId = undefined;
    }

    if (req.session.role !== UserType.ADMIN && req.path.includes('/log')) {
        throw new StatusError(403, 'You do not have permission to access this resource');
    }

}