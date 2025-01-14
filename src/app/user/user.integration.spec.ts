import 'reflect-metadata';
import { Container } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { LogService } from '../log/log.service';
import { User } from './user.model';
import request from 'supertest';
import { Server } from '../../server/server';
import { Application } from 'express';
import * as validationUtils from '../../utils/validation';
import * as createResponseUtils from '../../utils/response';
import bcrypt from 'bcrypt';

describe('User Integration Tests', () => {
    let databaseService: DatabaseService;
    let auditService: LogService;
    let userController: UserController;
    let userService: UserService;
    let userRepository: UserRepository;
    let server: Server;
    let app: Application;

    const spies: Record<string, jest.SpyInstance> = {};

    beforeAll(async () => {
        // Initialize the services
        Container.reset();
        databaseService = Container.get(DatabaseService);
        auditService = Container.get(LogService);
        userRepository = Container.get(UserRepository);
        userService = Container.get(UserService);
        userController = Container.get(UserController);

        // Initialize the server
        server = Container.get(Server);
        app = server.app;

        // Initialize the database
        await databaseService.initializeDatabase();
        await databaseService.clearDatabase();

        // Define the spies
        spies.userServiceRegister = jest.spyOn(userService, 'register');
        spies.userServiceLogin = jest.spyOn(userService, 'login');
        spies.userRepositoryCreate = jest.spyOn(userRepository, 'create');
        spies.userRepositoryExists = jest.spyOn(userRepository, 'exists');
        spies.userRepositoryFindByFields = jest.spyOn(userRepository, 'findByFields');
        spies.databaseServiceExecQuery = jest.spyOn(databaseService, 'execQuery');
        spies.userServiceAuditAction = jest.spyOn(userService, 'auditAction');
        spies.auditServiceCreate = jest.spyOn(auditService, 'create');
        spies.validateObject = jest.spyOn(validationUtils, 'validateObject');
        spies.bcryptHash = jest.spyOn(bcrypt, 'hash');
        spies.createResponse = jest.spyOn(createResponseUtils, 'createResponse');
    });

    // Close the server and the database after all tests
    afterAll(async () => {
        await server.closeServer();
        await databaseService.closeDatabase();
    });

    // Clear the database before each test
    beforeEach(async () => {
        await databaseService.clearDatabase();
    });

    // Clear the spies after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Define the helper functions
    async function registerUser(app: Application, user: Partial<User>) {
        return await request(app)
            .post('/api/register')
            .send(user);
    }

    async function loginUser(app: Application, user: Partial<User>) {
        return await request(app)
            .post('/api/login')
            .send(user);
    }

    function assertResponse(response: request.Response, status: number, body: object) {
        expect(response.status).toBe(status);
        expect(response.body).toEqual(expect.objectContaining(body));
    }

    async function assertAuditLogs(auditService: LogService, expectedLogs: number, messageContains: string[]) {
        const auditLogs = await auditService.findAll();
        expect(auditLogs).toHaveLength(expectedLogs);
        messageContains.forEach((msg, index) => {
            expect(auditLogs[index].message).toEqual(expect.stringContaining(msg));
        });
    }

    async function assertDatabaseState(username: string, shouldExist: boolean) {
        const result = await databaseService.execQuery({
            sql: 'SELECT * FROM users WHERE username = ?',
            params: [username]
        });
        const savedUser = result ? result.rows[0] : undefined;
        if (shouldExist) {
            expect(savedUser).toBeDefined();
            expect(savedUser!.username).toBe(username);
        } else {
            expect(savedUser).toBeUndefined();
        }
    }

    // Define the register tests
    describe('Register', () => {
        // Arrange
        const user = {
            username: 'testUser',
            password: 'testPassword'
        };

        it('should register the first new user', async () => {
            // Act
            const response = await registerUser(app, user);

            /**
             * Assert:
             * - The response status is 201
             * - The response body contains the expected data
             */
            assertResponse(response, 201, {
                status: 'success',
                message: expect.any(String),
                data: expect.objectContaining({
                    id: expect.any(Number),
                    username: user.username
                })
            });

            /**
             * Assert:
             * - The main workflow functions were called
             */
            expect(spies.userServiceRegister).toHaveBeenCalled();
            expect(spies.validateObject).toHaveBeenCalled();
            expect(spies.bcryptHash).toHaveBeenCalled();
            expect(spies.userRepositoryCreate).toHaveBeenCalled();
            expect(spies.userRepositoryExists).toHaveBeenCalled();
            expect(spies.databaseServiceExecQuery).toHaveBeenCalled();
            expect(spies.userServiceAuditAction).toHaveBeenCalled();
            expect(spies.auditServiceCreate).toHaveBeenCalled();
            expect(spies.createResponse).toHaveBeenCalled();

            /**
             * Assert:
             * - The database state is as expected
             * - The audit logs are as expected
             */
            await assertDatabaseState(user.username, true);
            await assertAuditLogs(auditService, 1, ['registered']);
        });

        it('should throw a 409 error when trying to register an existing user', async () => {
            // Arrange Register the user before to make it already exist
            await registerUser(app, user);

            // Clear the spies to track the next calls
            jest.clearAllMocks();

            // Act
            const response = await registerUser(app, user);

            /**
             * Assert:
             * - The response status is 409
             * - The response body contains the expected error
             */
            assertResponse(response, 409, {
                error: expect.any(String)
            });

            /**
             * Assert:
             * - The main workflow functions were called
             * - The workflow was interrupted before the audit logs
             */
            expect(spies.userServiceRegister).toHaveBeenCalled();
            expect(spies.validateObject).toHaveBeenCalled();
            expect(spies.bcryptHash).toHaveBeenCalled();
            expect(spies.userRepositoryCreate).toHaveBeenCalled();
            expect(spies.userRepositoryExists).toHaveBeenCalled();
            expect(spies.databaseServiceExecQuery).toHaveBeenCalled();
            expect(spies.userServiceAuditAction).not.toHaveBeenCalled();
            expect(spies.auditServiceCreate).not.toHaveBeenCalled();
            expect(spies.createResponse).not.toHaveBeenCalled();

            /**
             * Assert:
             * - The database state is as expected
             * - The audit logs are as expected
             * - It should only contain one log for the first registration
             */
            await assertDatabaseState(user.username, true);
            await assertAuditLogs(auditService, 1, ['registered']);
        });

        // Define the user cases with invalid data
        const invalidUsers = [
            { username: '', password: 'testPassword' },
            { username: 'testUser', password: '' },
            { username: '', password: '' },
            { password: 'testPassword' },
            { username: 'testUser' }
        ];

        invalidUsers.forEach((invalidUser, index) => {
            it(`should throw a 400 error when trying to register an invalid user (case ${index + 1})`, async () => {
                // Act
                const response = await registerUser(app, invalidUser);

                /**
                 * Assert:
                 * - The response status is 400
                 * - The response body contains the expected error
                 */
                assertResponse(response, 400, {
                    error: expect.any(String)
                });

                /**
                 * Assert:
                 * - The main workflow functions were called
                 * - The workflow was interrupted before the repository calls
                 */
                expect(spies.userServiceRegister).toHaveBeenCalled();
                expect(spies.validateObject).toHaveBeenCalled();
                expect(spies.bcryptHash).not.toHaveBeenCalled();
                expect(spies.userRepositoryCreate).not.toHaveBeenCalled();
                expect(spies.userRepositoryExists).not.toHaveBeenCalled();
                expect(spies.databaseServiceExecQuery).not.toHaveBeenCalled();
                expect(spies.userServiceAuditAction).not.toHaveBeenCalled();
                expect(spies.auditServiceCreate).not.toHaveBeenCalled();
                expect(spies.createResponse).not.toHaveBeenCalled();

                /**
                 * Assert:
                 * - The database state is as expected
                 * - The audit logs are as expected
                 * - It shouldn't contain any logs
                 */
                await assertDatabaseState(user.username, false);
                await assertAuditLogs(auditService, 0, []);
            });
        });
    });

    // Define the login tests
    describe('Login', () => {
        // Arrange
        const user = {
            username: 'testUser',
            password: 'testPassword'
        };

        // Register the user before each test and clear the spies to track the next calls
        beforeEach(async () => {
            await registerUser(app, user);
            jest.clearAllMocks();
        });

        // Clear the database after each test
        afterEach(async () => {
            await databaseService.clearDatabase();
        });

        it('should login an existing user', async () => {
            // Act
            const response = await loginUser(app, user);

            /**
             * Assert:
             * - The response status is 200
             * - The response body contains the expected data
             */
            assertResponse(response, 200, {
                status: 'success',
                message: expect.any(String),
                data: expect.objectContaining({
                    user: expect.objectContaining({
                        username: user.username
                    }),
                    token: expect.any(String)
                })
            });

            /**
             * Assert:
             * - The main workflow functions were called
             */
            expect(spies.userServiceLogin).toHaveBeenCalled();
            expect(spies.validateObject).toHaveBeenCalled();
            expect(spies.userRepositoryFindByFields).toHaveBeenCalled();
            expect(spies.databaseServiceExecQuery).toHaveBeenCalled();
            expect(spies.userServiceAuditAction).toHaveBeenCalled();
            expect(spies.auditServiceCreate).toHaveBeenCalled();
            expect(spies.createResponse).toHaveBeenCalled();

            await assertAuditLogs(auditService, 2, ['registered', 'logged in']);
        });

        it('should throw a 401 error for invalid credentials', async () => {
            // Arrange
            const invalidUser = { username: user.username, password: 'wrongPassword' };

            // Act
            const response = await loginUser(app, invalidUser);

            /**
             * Assert:
             * - The response status is 401
             * - The response body contains the expected error
             */
            assertResponse(response, 401, {
                error: expect.any(String)
            });

            /**
             * Assert:
             * - The main workflow functions were called
             * - The workflow was interrupted before the audit logs
             */
            expect(spies.userServiceLogin).toHaveBeenCalled();
            expect(spies.validateObject).toHaveBeenCalled();
            expect(spies.userRepositoryFindByFields).toHaveBeenCalled();
            expect(spies.databaseServiceExecQuery).toHaveBeenCalled();
            expect(spies.userServiceAuditAction).not.toHaveBeenCalled();
            expect(spies.auditServiceCreate).not.toHaveBeenCalled();
            expect(spies.createResponse).not.toHaveBeenCalled();

            /**
             * Assert:
             * - The audit logs are as expected
             */
            await assertAuditLogs(auditService, 1, ['registered']);
        });

        // Define the user cases with invalid data
        const invalidUsers = [
            { username: '', password: 'testPassword' },
            { username: 'testUser', password: '' },
            { username: '', password: '' },
            { password: 'testPassword' },
            { username: 'testUser' }
        ];

        invalidUsers.forEach((invalidUser, index) => {
            it(`should throw a 400 error when trying to login with invalid credentials (case ${index + 1})`, async () => {
                // Act
                const response = await loginUser(app, invalidUser);

                /**
                 * Assert:
                 * - The response status is 400
                 * - The response body contains the expected error
                 */
                assertResponse(response, 400, {
                    error: expect.any(String)
                });

                /**
                 * Assert:
                 * - The main workflow functions were called
                 * - The workflow was interrupted before the repository calls
                 */
                expect(spies.userServiceLogin).toHaveBeenCalled();
                expect(spies.validateObject).toHaveBeenCalled();
                expect(spies.userRepositoryFindByFields).not.toHaveBeenCalled();
                expect(spies.databaseServiceExecQuery).not.toHaveBeenCalled();
                expect(spies.userServiceAuditAction).not.toHaveBeenCalled();
                expect(spies.auditServiceCreate).not.toHaveBeenCalled();
                expect(spies.createResponse).not.toHaveBeenCalled();

                /**
                 * Assert:
                 * - The audit logs are as expected
                 */
                await assertAuditLogs(auditService, 1, ['registered']);
            });
        });
    });
});