import { NextFunction, Request, Response } from "express";
import { PatientController } from "../../../app/patient/patient.controller";
import { PatientService } from "../../../app/patient/patient.service";
import { createResponse } from "../../../utils/response";
import {Patient} from "../../../app/patient/patient.model";

jest.mock("../../../app/patient/patient.service");

describe('PatientController', () => {
    let patientController: PatientController;
    let patientService: jest.Mocked<PatientService>;

    beforeAll(() => {
        patientService = {
            create: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findByField: jest.fn(),
            update: jest.fn()
        } as unknown as jest.Mocked<PatientService>;
        patientController = new PatientController(patientService);
    });

    const mockResponse = (): Response => {
        const res = {} as Response;
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    it('should return all patients when no query is provided', async () => {
        const req = {
            query: {},
            session: { userId: 1 }
        } as unknown as Request;
        const res = mockResponse();
        const next = jest.fn() as NextFunction;

        patientService.findByField.mockResolvedValue([]);

        await patientController.getAll(req, res, next);

        expect(patientService.findByField).toHaveBeenCalledWith(req.session, {});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createResponse('success', 'Patient retrieved successfully', [])
        );
    });

    it('should return matching patients when searching by field', async () => {
        const req = {
            query: { condition: 'Diabetes' },
            session: { userId: 1 }
        } as unknown as Request;
        const res = mockResponse();
        const next = jest.fn() as NextFunction;

        const mockPatients = [{ id: 1, name: 'John Doe', gender: 'male' } as Patient];
        patientService.findByField.mockResolvedValue(mockPatients);

        await patientController.findByField(req, res, next);

        expect(patientService.findByField).toHaveBeenCalledWith(req.session, req.query);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createResponse('success', 'Patient retrieved successfully', mockPatients)
        );
    });

    it('should handle errors in findByField', async () => {
        const req = {
            query: { condition: 'Diabetes' },
            session: { userId: 1 }
        } as unknown as Request;
        const res = mockResponse();
        const next = jest.fn() as NextFunction;

        const error = new Error('Service error');
        patientService.findByField.mockRejectedValue(error);

        await patientController.findByField(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});