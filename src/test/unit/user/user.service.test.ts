import { UserService } from '../../../app/user/user.service';
import { UserRepository } from '../../../app/user/user.repository';
import { PatientRepository } from '../../../app/patient/patient.repository';
import { DoctorRepository } from '../../../app/doctor/doctor.repository';
import { LogService } from '../../../app/log/log.service';
import { User, UserType } from '../../../app/user/user.model';
import { Patient } from '../../../app/patient/patient.model';
import { DaysOfWeek, Doctor_Private } from '../../../app/doctor/doctor.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('UserService', () => {
    let userService: UserService;
    let userRepository: jest.Mocked<UserRepository>;
    let patientRepository: jest.Mocked<PatientRepository>;
    let doctorRepository: jest.Mocked<DoctorRepository>;
    let logService: jest.Mocked<LogService>;

    beforeAll(() => {
        userRepository = {
            create: jest.fn(),
            findByFields: jest.fn(),
        } as unknown as jest.Mocked<UserRepository>;

        patientRepository = {
            create: jest.fn(),
        } as unknown as jest.Mocked<PatientRepository>;

        doctorRepository = {
            create: jest.fn(),
        } as unknown as jest.Mocked<DoctorRepository>;

        logService = {
            createLog: jest.fn(),
        } as unknown as jest.Mocked<LogService>;

        userService = new UserService(logService, userRepository, patientRepository, doctorRepository);
    });

    describe('register', () => {
        it('should successfully register a new patient with valid data', async () => {
            const patientData = {
                username: 'testpatient',
                password: 'password123',
                role: UserType.PATIENT,
                name: 'Test Patient',
                date_of_birth: new Date(),
                gender: 'M',
                emergency_contact: '123456789',
                allergies: 'None',
                medical_history: 'None'
            };
            const hashedPassword = 'hashedPassword123';
            jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
            const createdUser = { id: 1, ...patientData, password: hashedPassword };
            userRepository.create.mockResolvedValue(createdUser);
            patientRepository.create.mockResolvedValue({ id: 1, user_id: 1, ...patientData } as unknown as Patient);
            const result = await userService.register(patientData);
            expect(result).not.toHaveProperty('password');
            expect(patientRepository.create).toHaveBeenCalled();
        });

        it('should successfully register a new doctor with valid data', async () => {
            const doctorData = {
                username: 'testdoctor',
                password: 'password',
                role: UserType.DOCTOR,
                name: 'Dr. John Doe',
                specialty: 'Cardiology',
                qualifications: ['MD', 'PhD'],
                availability: {
                    days: [DaysOfWeek.Monday, DaysOfWeek.Tuesday, DaysOfWeek.Wednesday, DaysOfWeek.Thursday, DaysOfWeek.Friday],
                    working_hours: ['08:00-12:00', '14:00-18:00'],
                    vacations: [new Date('2023-12-25'), new Date('2023-12-31')]
                },
                user_id: 123,
                phone: '123-456-7890',
                email: 'johndoe@example.com',
                address: '123 Main St, Anytown, USA'
            };
            const hashedPassword = 'hashedPassword123';
            jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
            const createdUser = { id: 1, ...doctorData, password: hashedPassword };
            userRepository.create.mockResolvedValue(createdUser as unknown as User);
            doctorRepository.create.mockResolvedValue({ id: 1, ...doctorData } as unknown as Doctor_Private);
            const result = await userService.register(doctorData as unknown as User);
            expect(result).not.toHaveProperty('password');
            expect(doctorRepository.create).toHaveBeenCalled();
        });

        it('should reject registration with ADMIN role', async () => {
            const adminData = {
                username: 'admin',
                password: 'password123',
                role: UserType.ADMIN
            };
            await expect(userService.register(adminData))
                .rejects
                .toThrow('Admin registration is not allowed');
        });

        it('should reject registration with missing required fields', async () => {
            const incompleteData = {
                username: 'testuser',
                role: UserType.PATIENT
            };
            await expect(userService.register(incompleteData))
                .rejects
                .toThrow('Invalid object. Missing fields');
        });

        it('should reject registration with existing username', async () => {
            const userData = {
                username: 'existinguser',
                password: 'password123',
                role: UserType.PATIENT,
                name: 'Existing User',
                date_of_birth: new Date(),
                gender: 'M',
                emergency_contact: '123456789',
                allergies: 'None',
                medical_history: 'None'
            };
            userRepository.create.mockRejectedValue(new Error('Duplicate entry'));
            await expect(userService.register(userData))
                .rejects
                .toThrow('Duplicate entry');
        });

        it('should reject registration with invalid role type', async () => {
            const invalidData = {
                username: 'testuser',
                password: 'password123',
                role: 'INVALID_ROLE'
            };
            await expect(userService.register(invalidData as unknown as User))
                .rejects
                .toThrow();
        });
    });

    describe('login', () => {
        it('should return user data and JWT token on successful login', async () => {
            const loginData = { username: 'testuser', password: 'password123', role: UserType.PATIENT };
            const storedUser = { id: 1, ...loginData, password: 'hashedPassword' };
            userRepository.findByFields.mockResolvedValue(storedUser as unknown as User);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
            jest.spyOn(jwt, 'sign').mockReturnValue('testtoken' as never);
            const result = await userService.login(loginData);
            expect(result).toHaveProperty('token');
            expect(result.user).not.toHaveProperty('password');
        });

        it('should reject login with incorrect password', async () => {
            const loginData = { username: 'testuser', password: 'wrongpassword', role: UserType.PATIENT };
            userRepository.findByFields.mockResolvedValue({
                username: 'testuser',
                password: 'hashedCorrectPassword',
                role: UserType.PATIENT
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
            await expect(userService.login(loginData))
                .rejects
                .toThrow('Invalid username or password');
        });

        it('should reject login with non-existent username', async () => {
            const loginData = { username: 'nonexistent', password: 'password123', role: UserType.PATIENT };
            userRepository.findByFields.mockResolvedValue(undefined);
            await expect(userService.login(loginData))
                .rejects
                .toThrow('Invalid username or password');
        });

        it('should reject login with missing required fields', async () => {
            const incompleteData = { username: 'testuser' };
            await expect(userService.login(incompleteData as unknown as User))
                .rejects
                .toThrow('Invalid object. Missing fields: password');
        });

        it('should handle unexpected errors gracefully', async () => {
            const loginData = { username: 'testuser', password: 'password123', role: UserType.PATIENT };
            jest.spyOn(userRepository, 'findByFields').mockRejectedValue(new Error('Unexpected error'));
            await expect(userService.login(loginData))
                .rejects
                .toThrow('Unexpected error');
        });
    });
});