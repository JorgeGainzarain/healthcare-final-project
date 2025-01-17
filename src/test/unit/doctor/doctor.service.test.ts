import { UserType } from "app/user/user.model";
import { DoctorService } from "../../../app/doctor/doctor.service";
import { Session, SessionData } from "express-session";
import { Doctor_Private } from "app/doctor/doctor.model";
import { ActionType } from "app/base/base.service";
import { StatusError } from "../../../utils/status_error";
import { DoctorRepository } from "../../../app/doctor/doctor.repository";
import { LogService } from "../../../app/log/log.service";

jest.mock("../../../app/doctor/doctor.repository");
jest.mock("../../../app/log/log.service");

describe('DoctorService', () => {
    let doctorService: DoctorService;
    let doctorRepository: jest.Mocked<DoctorRepository>;
    let logService: jest.Mocked<LogService>;

    beforeAll(() => {
        doctorRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
        } as unknown as jest.Mocked<DoctorRepository>
        logService = {
            createLog: jest.fn(),
        } as unknown as jest.Mocked<LogService>;
        doctorService = new DoctorService(doctorRepository, logService);
    });

    describe('findById', () => {
        it('should return full doctor data when user is admin', async () => {
            const mockDoctor = { id: 1, name: 'Dr. Smith', specialty: 'Cardiology', email: 'dr@test.com' } as Doctor_Private;
            const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;

            doctorRepository.findById.mockResolvedValue(mockDoctor);

            const result = await doctorService.findById(session, 1);

            expect(result).toEqual(mockDoctor);
        });

        it('should return full doctor data when doctor accesses own record', async () => {
            const mockDoctor = { id: 1, name: 'Dr. Smith', email: 'dr@test.com' } as Doctor_Private;
            const session = { role: UserType.DOCTOR, userId: 1, doctorId: 1 } as Session & SessionData;

            doctorRepository.findById.mockResolvedValue(mockDoctor);

            const result = await doctorService.findById(session, 1);

            expect(result).toEqual(mockDoctor);
        });

        it('should return public doctor data when user is patient', async () => {
            const mockDoctor = { id: 1, name: 'Dr. Smith', email: 'dr@test.com' } as Doctor_Private;
            const session = { role: UserType.PATIENT, userId: 1 } as Session & SessionData;

            doctorRepository.findById.mockResolvedValue(mockDoctor);

            const result = await doctorService.findById(session, 1);

            expect(result).not.toBe(expect.objectContaining({ email: expect.any(String) }));
            expect(result.id).toBe(mockDoctor.id);
            expect(result.name).toBe(mockDoctor.name);
        });

        it('should throw 403 when doctor tries to access other doctor data', async () => {
            const mockDoctor = { id: 2, name: 'Dr. Smith' } as Doctor_Private;
            const session = { role: UserType.DOCTOR, userId: 1, doctorId: 1 } as Session & SessionData;

            doctorRepository.findById.mockResolvedValue(mockDoctor);

            await expect(doctorService.findById(session, 2))
                .rejects
                .toThrow(new StatusError(403, 'You are not allowed to view another doctor'));
        });

        it('should throw error for undefined doctor ID', async () => {
            const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;

            await expect(doctorService.findById(session, undefined as any))
                .rejects
                .toThrow();
        });

        it('should throw error when doctor ID is undefined or null', async () => {
            const session = { role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
            const undefinedId = undefined;
            const nullId = null;

            await expect(doctorService.findById(session, undefinedId as any)).rejects.toThrow(StatusError);
            await expect(doctorService.findById(session, nullId as any)).rejects.toThrow(StatusError);
        });

        it('should return public doctor data excluding sensitive fields when user is a patient', async () => {
            const mockDoctor = {
                id: 1,
                name: 'Dr. Smith',
                specialty: 'Cardiology',
                qualifications: ['MD'],
                phone: '123-456-7890',
                email: 'dr@test.com',
                address: '123 Main St'
            } as Doctor_Private;
            const session = { role: UserType.PATIENT, patientId: 1, userId: 1 } as Session & SessionData;

            doctorRepository.findById = jest.fn().mockResolvedValue(mockDoctor);

            const result = await doctorService.findById(session, 1);

            expect(result).toEqual({
                id: 1,
                name: 'Dr. Smith',
                specialty: 'Cardiology',
                qualifications: ['MD']
            });
        });

        it('should return public doctor data excluding sensitive fields when user is anonymous', async () => {
            const mockDoctor = {
                id: 1,
                name: 'Dr. Smith',
                specialty: 'Cardiology',
                qualifications: ['MD'],
                phone: '123-456-7890',
                email: 'dr@test.com',
                address: '123 Main St'
            } as Doctor_Private;
            const session = {} as Session & SessionData;

            doctorRepository.findById = jest.fn().mockResolvedValue(mockDoctor);

            const result = await doctorService.findById(session, 1);

            expect(result).toEqual({
                id: 1,
                name: 'Dr. Smith',
                specialty: 'Cardiology',
                qualifications: ['MD']
            });
        });
    });

    describe('before', () => {
        it('should validate update permissions in before hook', async () => {
            const session = { role: UserType.DOCTOR, userId: 1, doctorId: 1 } as Session & SessionData;
            const updates = { name: 'New Name' };

            await expect(doctorService.before(ActionType.UPDATE, [session, 2, updates]))
                .rejects
                .toThrow('You are not allowed to update another doctor');
        });

        it('should handle different action types correctly', async () => {
            const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;

            await expect(doctorService.before(ActionType.CREATE, [session])).resolves.not.toThrow();
            await expect(doctorService.before(ActionType.UPDATE, [session, 1, {}])).resolves.not.toThrow();
            await expect(doctorService.before(ActionType.DELETE, [session])).resolves.not.toThrow();
        });

        it('should throw error when doctor tries to update restricted fields', async () => {
            const session = { role: UserType.DOCTOR, doctorId: 1, userId: 1 } as Session & SessionData;
            const part_updates = { id: 2, user_id: 3 }; // Restricted fields
            const args = [session, 1, part_updates];

            await expect(doctorService.before(ActionType.UPDATE, args)).rejects.toThrow(StatusError);
            await expect(doctorService.before(ActionType.UPDATE, args)).rejects.toThrow('You are not allowed to update the user id or doctor id');
        });
    });

    describe('after', () => {
        it('should handle array results in after hook', async () => {
            const doctors = [
                { id: 1, name: 'Dr. Smith', email: 'dr1@test.com' },
                { id: 2, name: 'Dr. Jones', email: 'dr2@test.com' }
            ] as Doctor_Private[];
            const session = { role: UserType.PATIENT, userId: 1 } as Session & SessionData;

            const result = await doctorService.after(ActionType.VIEW_ALL, doctors, [session]);

            expect(Array.isArray(result)).toBe(true);
            expect(result[0].email).toBeUndefined();
            expect(result[1].email).toBeUndefined();
        });
    });

    describe('create', () => {
        it('should handle doctors with missing required fields', async () => {
            const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;
            const invalidDoctor = { name: 'Dr. Smith' } as Partial<Doctor_Private>;

            await expect(doctorService.create(session, invalidDoctor))
                .rejects
                .toThrow();
        });

        it('should throw error when patient tries to update doctor', async () => {
            const session = { role: UserType.PATIENT, userId: 1 } as Session & SessionData;
            const partUpdates = { name: 'Dr. John' };
            const doctorId = 1;

            await expect(doctorService.update(session, doctorId, partUpdates))
                .rejects
                .toThrow(new StatusError(403, 'Patients are not allowed to update doctors'));
        });
    });
});