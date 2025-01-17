import { ActionType } from "app/base/base.service";
import { PatientService } from "../../../app/patient/patient.service";
import { UserType } from "../../../app/user/user.model";
import { Session, SessionData } from "express-session";
import { validateView } from "app/patient/validations/validateView";
import { StatusError } from "../../../utils/status_error";

jest.mock("app/patient/validations/validateView");
jest.mock("app/doctor/validations/validateUpdate");

describe('PatientService', () => {
    let patientService: PatientService;
    let patientRepository: any;
    let logService: any;
    let recordRepository: any;
    let appointmentRepository: any;

    beforeEach(() => {
        patientRepository = {
            findAll: jest.fn()
        };
        logService = {
            createLog: jest.fn()
        };
        recordRepository = {
            exists: jest.fn()
        };
        appointmentRepository = {
            exists: jest.fn()
        };
        patientService = new PatientService(patientRepository, logService, recordRepository, appointmentRepository);
    });

    it('should return all patients when user is admin', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }];
        const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;
        patientRepository.findAll.mockResolvedValue(mockPatients);
        const result = await patientService.findAll(session);
        expect(result).toEqual(mockPatients);
    });

    it('should return only patients with appointments or records for doctor', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }];
        const session = { role: UserType.DOCTOR, doctorId: 1, userId: 1 } as Session & SessionData;
        patientRepository.findAll.mockResolvedValue(mockPatients);
        recordRepository.exists.mockResolvedValueOnce(true);
        appointmentRepository.exists.mockResolvedValueOnce(false);
        const result = await patientService.findAll(session);
        expect(result).toEqual([{ id: 1 }]);
    });

    it('should validate view action for non-admin users', async () => {
        const session = { role: UserType.DOCTOR };
        const id = 1;
        await patientService.before(ActionType.VIEW, [session, id]);
        expect(validateView).toHaveBeenCalledWith([session, id]);
    });

    it('should throw error when patient tries to view all patients', async () => {
        const session = { userId: 1, patientId: 1, role: UserType.PATIENT } as Session & SessionData;
        await expect(patientService.findAll(session))
            .rejects
            .toThrow(new StatusError(403, 'Patients are not allowed to view all patients'));
    });

    it('should return empty array for doctor with no patient relationships', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }];
        const session = { role: UserType.DOCTOR, doctorId: 1, userId: 1 } as Session & SessionData;
        patientRepository.findAll.mockResolvedValue(mockPatients);
        recordRepository.exists.mockResolvedValue(false);
        appointmentRepository.exists.mockResolvedValue(false);
        const result = await patientService.findAll(session);
        expect(result).toEqual([]);
    });

    it('should return empty array when no patients exist', async () => {
        const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;
        patientRepository.findAll.mockResolvedValue([]);
        const result = await patientService.findAll(session);
        expect(result).toEqual([]);
    });

    it('should handle multiple concurrent findAll requests', async () => {
        const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;
        const mockPatients = [{ id: 1 }];
        patientRepository.findAll.mockResolvedValue(mockPatients);
        await Promise.all([
            patientService.findAll(session),
            patientService.findAll(session),
            patientService.findAll(session)
        ]);
        expect(patientRepository.findAll).toHaveBeenCalledTimes(3);
    });

    it('should handle undefined session values', async () => {
        const session = { role: UserType.DOCTOR, doctorId: 1, userId: 1 } as Session & SessionData;
        await expect(patientService.findAll(session))
            .rejects
            .toThrow();
    });

    it('should filter patients based on doctor relationships', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const session = { role: UserType.DOCTOR, doctorId: 1, userId: 1 } as Session & SessionData;
        patientRepository.findAll.mockResolvedValue(mockPatients);
        recordRepository.exists.mockResolvedValueOnce(true);
        recordRepository.exists.mockResolvedValueOnce(false);
        recordRepository.exists.mockResolvedValueOnce(true);
        appointmentRepository.exists.mockResolvedValue(false);
        const result = await patientService.findAll(session);
        expect(result).toEqual([{ id: 1 }, { id: 3 }]);
    });

    it('should return all patients when user is admin', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }];
        const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;
        patientRepository.findAll = jest.fn().mockResolvedValue(mockPatients);
        const result = await patientService.findAll(session);
        expect(result).toEqual(mockPatients);
    });

    it('should return patients with existing appointments or records when user is doctor', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }];
        const session = { role: UserType.DOCTOR, userId: 1, doctorId: 123 } as Session & SessionData;
        patientRepository.findAll.mockResolvedValue(mockPatients);

        recordRepository.exists.mockImplementation(({ patient_id, doctor_id }: { patient_id: number; doctor_id: number }) => {
            return Promise.resolve(patient_id === 1 && doctor_id === 123);
        });
        appointmentRepository.exists.mockImplementation(({ patient_id, doctor_id }: { patient_id: number; doctor_id: number }) => {
            return Promise.resolve(patient_id === 2 && doctor_id === 123);
        });

        const result = await patientService.findAll(session);
        expect(result).toEqual(mockPatients);
    });

    it('should throw error when non-admin user tries to update another patient', async () => {
        const session = { role: UserType.PATIENT, userId: 1, patientId: 2 };
        const args = [session, 3, { name: 'New Name' }];

        await expect(patientService.before(ActionType.UPDATE, args)).rejects.toThrow(StatusError);
    });

    it('should throw 403 error when patient user tries to view all patients', async () => {
        const session = { role: UserType.PATIENT, userId: 1 } as Session & SessionData;
        await expect(patientService.findAll(session)).rejects.toThrow(StatusError);
        await expect(patientService.findAll(session)).rejects.toThrow('Patients are not allowed to view all patients');
    });

    it('should return empty array when no patients are found', async () => {
        const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;
        patientRepository.findAll.mockResolvedValue([]);
        const result = await patientService.findAll(session);
        expect(result).toEqual([]);
    });

    it('should return empty array when doctor has no appointments or records with patients', async () => {
        const session = { role: UserType.DOCTOR, userId: 1, doctorId: 1 } as Session & SessionData;
        const mockPatients = [{ id: 1 }, { id: 2 }];
        patientRepository.findAll.mockResolvedValue(mockPatients);

        jest.spyOn(recordRepository, 'exists').mockResolvedValue(false);
        jest.spyOn(appointmentRepository, 'exists').mockResolvedValue(false);

        const result = await patientService.findAll(session);

        expect(result).toEqual([]);
    });

    it('should handle multiple concurrent requests correctly', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }];
        const session = { role: UserType.DOCTOR, userId: 1, doctorId: 1 } as Session & SessionData;

        patientRepository.findAll.mockResolvedValue(mockPatients);
        recordRepository.exists = jest.fn().mockResolvedValue(true);
        appointmentRepository.exists = jest.fn().mockResolvedValue(false);

        const result = await Promise.all([
            patientService.findAll(session),
            patientService.findAll(session)
        ]);

        expect(result[0]).toEqual(mockPatients);
        expect(result[1]).toEqual(mockPatients);
        expect(recordRepository.exists).toHaveBeenCalledTimes(4);
        expect(appointmentRepository.exists).toHaveBeenCalledTimes(4);
    });

    it('should skip validation hooks when user is admin', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }];
        const session = { role: UserType.ADMIN, userId: 1 } as Session & SessionData;

        patientRepository.findAll.mockResolvedValue(mockPatients);


        const result = await patientService.findAll(session);

        expect(result).toEqual(mockPatients);
        expect(patientRepository.findAll).toHaveBeenCalled();
    });

    it('should return only patients associated with the doctor\'s appointments or records when user is doctor', async () => {
        const mockPatients = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const session = { role: UserType.DOCTOR, userId: 1, doctorId: 101 } as Session & SessionData;
        const expectedPatients = [{ id: 1 }, { id: 3 }];

        patientRepository.findAll.mockResolvedValue(mockPatients);

        recordRepository.exists
            .mockResolvedValueOnce(true) // Patient 1 has a record with doctor
            .mockResolvedValueOnce(false) // Patient 2 has no record with doctor
            .mockResolvedValueOnce(false); // Patient 3 has no record with doctor

        appointmentRepository.exists
            .mockResolvedValueOnce(false) // Patient 1 has no appointment with doctor
            .mockResolvedValueOnce(false) // Patient 2 has no appointment with doctor
            .mockResolvedValueOnce(true); // Patient 3 has an appointment with doctor

        const result = await patientService.findAll(session);
        expect(result).toEqual(expectedPatients);
    });
});