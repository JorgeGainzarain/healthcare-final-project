import {RecordService} from "../../../app/record/record.service";
import {UserType} from "../../../app/user/user.model";
import {Session, SessionData} from "express-session";
import {ActionType} from "../../../app/base/base.service";
import {StatusError} from "../../../utils/status_error";
import {Record, Record_Details} from "../../../app/record/record.model";

describe('RecordService', () => {
    let recordService: RecordService;
    let recordRepository: any;
    let logService: any;
    let notificationService: any;
    let patientRepository: any;
    let doctorRepository: any;

    beforeAll(() => {
        recordRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        };
        logService = { createLog: jest.fn() };
        notificationService = { create: jest.fn() };
        patientRepository = {
            findById: jest.fn(),
            exists: jest.fn(),
            existsById: jest.fn()
        };
        doctorRepository = {
            findById: jest.fn(),
            exists: jest.fn(),
            existsById: jest.fn()
        };
        recordService = new RecordService(recordRepository, logService, notificationService, patientRepository, doctorRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ADMIN users can access all records without filtering
    it('should return all records when user is ADMIN', async () => {
        const mockRecords = [
            { id: 1, doctor_id: 1, patient_id: 1 },
            { id: 2, doctor_id: 2, patient_id: 2 }
        ];
        const session = { userId: 1, role: UserType.ADMIN } as Session & SessionData;
        recordRepository.findAll.mockResolvedValue(mockRecords);

        const result = await recordService.findAll(session);

        expect(result).toEqual(mockRecords);
        expect(logService.createLog).toHaveBeenCalled();
    });

    // DOCTOR users can only view records where they are the doctor_id
    it('should filter records for DOCTOR role based on doctor_id', async () => {
        const mockRecords = [
            { id: 1, doctor_id: 1, patient_id: 1 },
            { id: 2, doctor_id: 2, patient_id: 2 }
        ];
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        recordRepository.findAll.mockResolvedValue(mockRecords);

        const result = await recordService.findAll(session);

        expect(result).toHaveLength(1);
        expect(result[0].doctor_id).toBe(session.doctorId);
    });

    // PATIENT users can only view records where they are the patient_id
    it('should filter records for PATIENT role based on patient_id', async () => {
        const mockRecords = [
            { id: 1, doctor_id: 1, patient_id: 1 },
            { id: 2, doctor_id: 1, patient_id: 2 }
        ];
        const session = { userId: 1, role: UserType.PATIENT, patientId: 1 } as Session & SessionData;
        recordRepository.findAll.mockResolvedValue(mockRecords);

        const result = await recordService.findAll(session);

        expect(result).toHaveLength(1);
        expect(result[0].patient_id).toBe(session.patientId);
    });

    // Notifications are sent to both doctor and patient when records are created
    it('should create notifications when record is created', async () => {
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        const record = { doctor_id: 1, patient_id: 2 };
    
        await recordService.after(ActionType.CREATE, record, [session]);

        expect(notificationService.create).toHaveBeenCalledWith(
            session,
            expect.objectContaining({
                title: 'Record Created',
                user_ids: [1, 2]
            })
        );
    });

    // Notifications are sent to both doctor and patient when records are updated
    it('should create notifications when record is updated', async () => {
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 };
        const record = { doctor_id: 1, patient_id: 2 };
    
        await recordService.after(ActionType.UPDATE, record, [session]);

        expect(notificationService.create).toHaveBeenCalledWith(
            session,
            expect.objectContaining({
                title: 'Record Updated',
                user_ids: [1, 2]
            })
        );
    });

    // Logged actions are tracked for all record operations
    it('should log action when records are retrieved', async () => {
        const session = { userId: 1, role: UserType.ADMIN } as Session & SessionData;
        const mockRecords = [{ id: 1 }];
        recordRepository.findAll.mockResolvedValue(mockRecords);

        await recordService.findAll(session);

        expect(logService.createLog).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: 1,
                message: expect.stringContaining('retrieved')
            })
        );
    });

    // Session without role throws 403 error
    it('should throw 403 error when session has no role', async () => {
        const session = { userId: 1 };
    
        await expect(recordService.before(ActionType.VIEW, [session]))
            .rejects
            .toThrow(new StatusError(403, 'You must be logged in to perform this action'));
    });

    // PATIENT attempting to create records throws 403 error
    it('should throw 403 error when PATIENT tries to create record', async () => {
        const session = { userId: 1, role: UserType.PATIENT };
    
        await expect(recordService.before(ActionType.CREATE, [session, {}]))
            .rejects
            .toThrow(new StatusError(403, 'Patients are not allowed to create appointments'));
    });

    // DOCTOR attempting to update another doctor's record throws 403 error
    it('should throw 403 error when DOCTOR updates another doctor record', async () => {
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 };
        const record = { id: 1, doctor_id: 2 };
        recordRepository.findById.mockResolvedValue(record);

        await expect(recordService.before(ActionType.UPDATE, [session, 1, {}]))
            .rejects
            .toThrow(new StatusError(403, 'You can only update records you created'));
    });

    // DOCTOR attempting to change doctor_id in updates throws 403 error
    it('should throw 403 error when DOCTOR tries to change doctor_id', async () => {
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 };
        const record = { id: 1, doctor_id: 1 };
        recordRepository.findById.mockResolvedValue(record);

        await expect(recordService.before(ActionType.UPDATE, [session, 1, { doctor_id: 2 }]))
            .rejects
            .toThrow(new StatusError(403, 'You cannot change the doctor of a record'));
    });

    // Empty or invalid session parameters handling
    it('should handle empty session parameters gracefully', async () => {
        const session = {} as Session & SessionData;

        recordRepository.findAll.mockResolvedValue([]);

        await expect(recordService.findAll(session))
            .rejects
            .toThrow(new StatusError(403, 'You must be logged in to perform this action'));
    });

    // Records array is empty after role-based filtering
    it('should return empty array when no records match role filter', async () => {
        const mockRecords = [
            { id: 1, doctor_id: 2, patient_id: 2 },
            { id: 2, doctor_id: 3, patient_id: 3 }
        ];
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        recordRepository.findAll.mockResolvedValue(mockRecords);

        const result = await recordService.findAll(session);

        expect(result).toHaveLength(0);
    });

    // ADMIN users can access all records without filtering
    it('should return all records when user is ADMIN', async () => {
        const mockRecords = [
            { id: 1, doctor_id: 1, patient_id: 1 },
            { id: 2, doctor_id: 2, patient_id: 2 }
        ];
        const session = { userId: 1, role: UserType.ADMIN } as Session & SessionData;
        recordRepository.findAll = jest.fn().mockResolvedValue(mockRecords);
        logService.createLog = jest.fn();

        const result = await recordService.findAll(session);

        expect(result).toEqual(mockRecords);
        expect(logService.createLog).toHaveBeenCalled();
    });

    // DOCTOR users can only view records where they are the doctor_id
    it('should return only records where doctor_id matches session.doctorId when user is DOCTOR', async () => {
        const mockRecords = [
            { id: 1, doctor_id: 1, patient_id: 1 },
            { id: 2, doctor_id: 2, patient_id: 2 }
        ];
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        recordRepository.findAll.mockResolvedValue(mockRecords);

        const result = await recordService.findAll(session);

        expect(result).toEqual([{ id: 1, doctor_id: 1, patient_id: 1 }]);
        expect(logService.createLog).toHaveBeenCalled();
    });

    // PATIENT users can only view records where they are the patient_id
    it('should return only records where the user is the patient when user is PATIENT', async () => {
        const mockRecords = [
            { id: 1, doctor_id: 1, patient_id: 1 },
            { id: 2, doctor_id: 2, patient_id: 2 }
        ];
        const session = { userId: 1, role: UserType.PATIENT, patientId: 1 } as Session & SessionData;
        recordRepository.findAll.mockResolvedValue(mockRecords);

        const result = await recordService.findAll(session);

        expect(result).toEqual([{ id: 1, doctor_id: 1, patient_id: 1 }]);
        expect(logService.createLog).toHaveBeenCalled();
    });

    // Notifications are sent to both doctor and patient when records are created
    it('should send notifications to doctor and patient when a record is created', async () => {
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        const partEntity = { doctor_id: 1, patient_id: 2, record_details: {} } as Partial<Record>;
        const createdRecord = { id: 1, ...partEntity };

        patientRepository.existsById.mockResolvedValue(true);
        doctorRepository.existsById.mockResolvedValue(true);

        recordRepository.findById.mockResolvedValue(createdRecord);
        recordRepository.create.mockResolvedValue(createdRecord);
        notificationService.create = jest.fn();

        await recordService.create(session, partEntity);

        expect(notificationService.create).toHaveBeenCalledWith(session, {
            title: 'Record Created',
            message: 'Your record has been successfully created',
            user_ids: [createdRecord.doctor_id, createdRecord.patient_id],
            timestamp: expect.any(Date)
        });
    });

    // Notifications are sent to both doctor and patient when records are updated
    it('should send notifications to both doctor and patient when a record is updated', async () => {
        const mockRecord = { id: 1, doctor_id: 1, patient_id: 2 };
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        const partUpdates = { record_details: { notes: 'Updated notes' } as Partial<Record_Details> } as Partial<Record>;

        recordRepository.update.mockResolvedValue(mockRecord);
        recordRepository.findById.mockResolvedValue(mockRecord);
        notificationService.create = jest.fn();

        await recordService.update(session, mockRecord.id, partUpdates);

        expect(notificationService.create).toHaveBeenCalledWith(session, {
            title: 'Record Updated',
            message: 'Your record has been successfully updated',
            user_ids: [mockRecord.doctor_id, mockRecord.patient_id],
            timestamp: expect.any(Date)
        });
    });

    // PATIENT attempting to create records throws 403 error
    it('should throw 403 error when PATIENT attempts to create a record', async () => {
        const session = { userId: 1, role: UserType.PATIENT } as Session & SessionData;
        const partEntity = { doctor_id: 1, patient_id: 1, record_details: {} } as Partial<Record>;

        await expect(recordService.create(session, partEntity)).rejects.toThrow(StatusError);
        await expect(recordService.create(session, partEntity)).rejects.toThrow('Patients are not allowed to create appointments');
    });

    // DOCTOR attempting to update another doctor's record throws 403 error
    it('should throw 403 error when DOCTOR tries to update another doctor\'s record', async () => {
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        const recordId = 2;
        const partUpdates = { record_details: {} } as Partial<Record>;
        const mockRecord = { id: recordId, doctor_id: 2, patient_id: 1, record_details: {} };
    
        recordRepository.findById.mockResolvedValue(mockRecord);
    
        await expect(recordService.update(session, recordId, partUpdates))
            .rejects
            .toThrow(new StatusError(403, 'You can only update records you created'));
    
        expect(recordRepository.findById).toHaveBeenCalledWith(recordId);
    });

    // DOCTOR attempting to change doctor_id in updates throws 403 error
    it('should throw 403 error when DOCTOR attempts to change doctor_id in updates', async () => {
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        const part_updates = { doctor_id: 2 };
        const id = 1;
        const record = { id: 1, doctor_id: 1, patient_id: 1 };

        recordRepository.findById.mockResolvedValue(record);

        await expect(recordService.update(session, id, part_updates))
            .rejects
            .toThrow(new StatusError(403, 'You cannot change the doctor of a record'));

        expect(recordRepository.findById).toHaveBeenCalledWith(id);
    });

    // Records array is empty after role-based filtering
    it('should return an empty array when user is DOCTOR with no matching records', async () => {
        const mockRecords = [
            { id: 1, doctor_id: 2, patient_id: 1 },
            { id: 2, doctor_id: 3, patient_id: 2 }
        ];
        const session = { userId: 1, role: UserType.DOCTOR, doctorId: 1 } as Session & SessionData;
        recordRepository.findAll.mockResolvedValue(mockRecords);

        const result = await recordService.findAll(session);

        expect(result).toEqual([]);
        expect(logService.createLog).not.toHaveBeenCalled();
    });

    // Role validation occurs before any record operation
    it('should throw error when role is not provided in session', async () => {
        const session = { userId: 1 }; // No role provided
        const args = [session, 1]; // Example args for a record operation

        await expect(recordService.before(ActionType.VIEW, args))
            .rejects
            .toThrow(new StatusError(403, 'You must be logged in to perform this action'));
    });
});
