import { NextFunction, Request, Response } from "express";
import { DoctorController } from "../../../app/doctor/doctor.controller";
import { DoctorService } from "../../../app/doctor/doctor.service";
import { createResponse } from "../../../utils/response";
import {Doctor_Private} from "../../../app/doctor/doctor.model";

jest.mock("../../../app/doctor/doctor.service");

describe('DoctorController', () => {
    let doctorController: DoctorController;
    let doctorService: jest.Mocked<DoctorService>;

    beforeEach(() => {
        doctorService = {
            create: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findByField: jest.fn(),
            update: jest.fn()
        } as unknown as jest.Mocked<DoctorService>;
        doctorController = new DoctorController(doctorService);
    });

    const mockResponse = (): Response => {
        const res = {} as Response;
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    it('should return all doctors when no query is provided', async () => {
        const req = {
            query: {},
            session: { userId: 1 }
        } as unknown as Request;
        const res = mockResponse();
        const next = jest.fn() as NextFunction;

        doctorService.findByField.mockResolvedValue([]);

        await doctorController.getAll(req, res, next);

        expect(doctorService.findByField).toHaveBeenCalledWith(req.session, {});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createResponse('success', 'Doctor retrieved successfully', [])
        );
    });

    it('should return matching doctors when searching by field', async () => {
        const req = {
            query: { specialty: 'Cardiology' },
            session: { userId: 1 }
        } as unknown as Request;
        const res = mockResponse();
        const next = jest.fn() as NextFunction;

        const mockDoctors = [{ id: 1, name: 'Dr. Smith', specialty: 'Cardiology' } as Doctor_Private];
        doctorService.findByField.mockResolvedValue(mockDoctors);

        await doctorController.findByField(req, res, next);

        expect(doctorService.findByField).toHaveBeenCalledWith(req.session, req.query);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createResponse('success', 'Doctor retrieved successfully', mockDoctors)
        );
    });

    it('should handle errors in findByField', async () => {
        const req = {
            query: { specialty: 'Cardiology' },
            session: { userId: 1 }
        } as unknown as Request;
        const res = mockResponse();
        const next = jest.fn() as NextFunction;

        const error = new Error('Service error');
        doctorService.findByField.mockRejectedValue(error);

        await doctorController.findByField(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});