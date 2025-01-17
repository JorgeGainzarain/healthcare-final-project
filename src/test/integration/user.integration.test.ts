import {User, UserType} from "../../app/user/user.model";
import {Patient} from "../../app/patient/patient.model";
import {DaysOfWeek, Doctor_Private} from "../../app/doctor/doctor.model";
import {UserController} from "../../app/user/user.controller";
import {UserService} from "../../app/user/user.service";
import {UserRepository} from "../../app/user/user.repository";
import {DatabaseService} from "../../database/database.service";
import {LogService} from "../../app/log/log.service";
import {PatientRepository} from "../../app/patient/patient.repository";
import {DoctorRepository} from "../../app/doctor/doctor.repository";
import {LogRepository} from "../../app/log/log.repository";
import {Server} from "../../server/server";
import {Api} from "../../server/api/api";
import {Container} from "typedi";
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();


describe('User', () => {
    let adminUser: User;
    let patient: Patient;
    let doctor: Doctor_Private;
    let doctorUser: User;
    let patientUser: User;

    let server: Server;
    let api: Api;
    let userController: UserController;
    let userService: UserService;
    let userRepository: UserRepository;
    let databaseService: DatabaseService;
    let logService: LogService;
    let logRepository: LogRepository;
    let patientRepository: PatientRepository;
    let doctorRepository: DoctorRepository;

    let genericUserWithoutPassword: Omit<User, 'password'>;
    let genericUser: User;

    let loginPatient: User;
    let loginDoctor: User;

    beforeAll(async () => {
        adminUser = {
            username: 'testUser',
            password: 'testPassword',
            role: UserType.ADMIN
        }
        patient = {
            user_id: 1,
            name: 'testPatient',
            date_of_birth: '2020-01-01T00:00:00.000Z' as unknown as Date,
            gender: 'male',
            emergency_contact: '123456789',
            allergies: [],
            medical_history: []
        }
        doctor = {
            user_id: 1,
            name: 'testDoctor',
            specialty: 'testSpecialty',
            qualifications: ['testQualification'],
            availability: {
                days: [DaysOfWeek.Friday, DaysOfWeek.Monday, DaysOfWeek.Saturday],
                working_hours: ['08:00-12:00'],
                vacations: []
            },
            phone: '123456789',
            email: 'testDoctor@mail.com',
            address: 'testAddress',
        }
        doctorUser = {
            username: 'testDoctorUser',
            password: 'testDoctor',
            role: UserType.DOCTOR,
            ...doctor
        }
        patientUser = {
            username: 'testPatientUser',
            password: 'testPatient',
            role: UserType.PATIENT,
            ...patient
        }

        genericUserWithoutPassword = {
            username: expect.any(String),
            role: expect.any(UserType),
        }
        genericUser = {
            ...genericUserWithoutPassword,
            password: expect.any(String),
        }
        loginPatient = {
            username: patientUser.username,
            password: patientUser.password,
            role: UserType.PATIENT
        }
        loginDoctor = {
            username: doctorUser.username,
            password: doctorUser.password,
            role: UserType.DOCTOR
        }

        databaseService = new DatabaseService();
        logRepository = new LogRepository(databaseService);
        logService = new LogService(logRepository);
        userRepository = new UserRepository(databaseService);
        patientRepository = new PatientRepository(databaseService);
        doctorRepository = new DoctorRepository(databaseService);
        userService = new UserService(logService, userRepository, patientRepository, doctorRepository);
        userController = new UserController(userService);

        api = Container.get(Api);
        api.userController = userController;
        server = new Server(api);

        await databaseService.initializeDatabase();
    });

    beforeEach(async () => {
        await databaseService.clearDatabase();
        jest.clearAllMocks();
    });

    describe('Register', () => {
        it('should register a patientUser', async () => {
            // Act
            const response = await apiCall('register', 'post', patientUser);
            const body = response.body;
            const data = body.data;

            // Assert
            expect(response.status).toBe(201);
            expect(data).toHaveProperty('id');
            expect(data).not.toHaveProperty('password');

            // Search for the user in the database
            const user = await userRepository.findById(data.id);
            expect(user).toHaveProperty('id');
            expect(user).toMatchObject(expect.objectContaining({
                username: patientUser.username,
                role: patientUser.role
            }));

            // Search for the patient in the database
            const patient_response = await patientRepository.findByFields({ user_id: data.id });
            expect(patient_response).toMatchObject(patient);
        });

        it('should register a doctorUser', async () => {
            // Act
            const response = await apiCall('register', 'post', doctorUser);
            const body = response.body;
            const data = body.data;

            // Assert
            expect(response.status).toBe(201);
            expect(data).toHaveProperty('id');
            expect(data).not.toHaveProperty('password');

            // Search for the user in the database
            const user = await userRepository.findById(data.id);
            expect(user).toMatchObject(expect.objectContaining({
                username: doctorUser.username,
                role: doctorUser.role
            }));

            // Search for the doctor in the database
            const doctor_response = await doctorRepository.findByFields({ user_id: data.id });
            expect(doctor_response).toMatchObject(doctor);
        });

        it('should throw an error when a admin is trying to register', async () => {
            // Act
            const response = await apiCall('register', 'post', adminUser);
            const body = response.body;

            // Assert
            expect(response.status).toBe(403);
            expect(body).toMatchObject({
                error: expect.any(String)
            });
        });

        it('should throw an error when a user is trying to register without a required field', async () => {
            // Arrange
            const userWithoutUsername = { ...patientUser, username: undefined };

            // Act
            const response = await apiCall('register', 'post', userWithoutUsername);
            const body = response.body;

            // Assert
            expect(response.status).toBe(400);
            expect(body).toMatchObject({
                error: expect.any(String)
            });
        });
    });

    describe('Login', () => {

        beforeEach(async () => {
            // Arrange
            await databaseService.clearDatabase();
            await databaseService.initializeDatabase();
            await apiCall('register', 'post', patientUser);
            await apiCall('register', 'post', doctorUser);
            jest.clearAllMocks();
        });

        it('should login a patient', async () => {
            // Act
            const response = await apiCall('login', 'post', loginPatient);
            const body = response.body;
            const data = body.data;

            // Assert
            expect(response.status).toBe(200);
            expect(data).toHaveProperty('user');
            expect(data).toHaveProperty('token');
            expect(data).toMatchObject({
                token: expect.any(String),
                user: {
                    id: expect.any(Number),
                    username: patientUser.username,
                    role: patientUser.role
                }
            });
        });

        it('should login a doctor', async () => {
            // Arrange
            await apiCall('register', 'post', doctorUser);
            jest.clearAllMocks();

            // Act
            const response = await apiCall('login', 'post', loginDoctor);
            const body = response.body;
            const data = body.data;

            // Assert
            expect(response.status).toBe(200);
            expect(data).toHaveProperty('user');
            expect(data).toHaveProperty('token');
            expect(data).toMatchObject({
                token: expect.any(String),
                user: {
                    id: expect.any(Number),
                    username: doctorUser.username,
                    role: doctorUser.role
                }
            });
        });

        it('should login a admin', async () => {
            // Arrange
            const admins = JSON.parse(process.env.ADMIN_USERS || '[]');
            const admin = {
                username: admins[0].username,
                password: admins[0].password,
                role: UserType.ADMIN
            };
            await apiCall('register', 'post', admin);
            jest.clearAllMocks();

            // Act
            const response = await apiCall('login', 'post', admin);
            const body = response.body;
            const data = body.data;

            // Assert
            expect(response.status).toBe(200);
            expect(data).toHaveProperty('user');
            expect(data).toHaveProperty('token');
            expect(data).toMatchObject({
                token: expect.any(String),
                user: {
                    id: expect.any(Number),
                    username: admin.username,
                    role: admin.role
                }
            });
        });

        it('should throw an error when a user is trying to login with a wrong password', async () => {
            // Act
            const response = await apiCall('login', 'post', { ...loginPatient, password: 'wrongPassword' });
            const body = response.body;

            // Assert
            expect(response.status).toBe(401);
            expect(body).toMatchObject({
                error: expect.any(String)
            });
        });

        it('should throw an error when a user is trying to login with a wrong username', async () => {
            // Act
            const response = await apiCall('login', 'post', { ...loginPatient, username: 'wrongUsername' });
            const body = response.body;

            // Assert
            expect(response.status).toBe(401);
            expect(body).toMatchObject({
                error: expect.any(String)
            });
        });

    });

    async function apiCall(url: string, method: 'get' | 'post' | 'put' | 'delete', data?: any) {
        return await request(server.app)
            [method]('/api/' + url)
            .send(data);
    }

    afterAll(async () => {
        await server.closeServer();
    });
});

