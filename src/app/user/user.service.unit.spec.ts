import 'reflect-metadata';
import { Container } from 'typedi';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { User } from './user.model';
import { StatusError } from '../../utils/status_error';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LogService } from '../log/log.service';
import * as validationUtils from "../../utils/validation";
import {config} from "../../config/environment";

describe('UserService Unit Tests', () => {
    // Test fixtures
    let userService: UserService;
    let userRepositoryMock: UserRepository;
    let auditServiceMock: LogService;
    let mockUser: User;
    let auditActionSpy: jest.SpyInstance;
    let bcryptHashSpy: jest.SpyInstance;
    let bcryptCompareSpy: jest.SpyInstance;
    let jwtSignSpy: jest.SpyInstance;
    let validateObjectSpy: jest.SpyInstance;
    let requiredValues = config.entityValues.user.requiredFields;

    beforeEach(() => {
        // Reset container and initialize mocks
        Container.reset();

        // Setup service mocks
        userRepositoryMock = {
            create: jest.fn(),
            findByFields: jest.fn(),
        } as unknown as UserRepository;

        auditServiceMock = {
            create: jest.fn(),
        } as unknown as LogService;

        // Register mocks in the container
        Container.set(UserRepository, userRepositoryMock);
        Container.set(LogService, auditServiceMock);

        // Initialize service using the container
        userService = Container.get(UserService);

        // Setup test data
        mockUser = { username: 'testUser', password: 'password123' };

        // Setup spies
        auditActionSpy = jest.spyOn(userService, 'auditAction');
        bcryptHashSpy = jest.spyOn(bcrypt, 'hash');
        bcryptCompareSpy = jest.spyOn(bcrypt, 'compare');
        jwtSignSpy = jest.spyOn(jwt, 'sign');
        validateObjectSpy = jest.spyOn(validationUtils, 'validateObject');
    });

    afterEach(() => {
        // Clear all mocks and spies
        jest.clearAllMocks();
    });

    describe('Register', () => {
        it('should successfully registers a new user', async () => {
            // Arrange and mock service response
            const unHashedPassword = mockUser.password;
            const hashedPassword = await bcrypt.hash(mockUser.password, 10);
            (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

            const createdUser = { ...mockUser, id: 1, password: hashedPassword };
            (userRepositoryMock.create as jest.Mock).mockResolvedValueOnce(createdUser);

            const { password, ...userWithoutPassword } = createdUser;
            const userWithEmptyPassword = { ...userWithoutPassword, password: '' };

            // Act
            const result = await userService.register(mockUser);

            /**
             * Assert:
             * - The user data was returned without the password
             * - The validateObject was called with the correct parameters
             * - The password hash was called with the correct parameters
             * - The user repository was called with the correct data
             * - The auditAction was called with the correct parameters
             * - The auditAction was called with the correct parameters
             */
            expect(result).toEqual(expect.objectContaining(userWithoutPassword));
            expect(validateObjectSpy).toHaveBeenCalledWith(mockUser, requiredValues);
            expect(bcryptHashSpy).toHaveBeenCalledWith(unHashedPassword, 10);
            expect(userRepositoryMock.create).toHaveBeenCalledWith(
                { username: mockUser.username, password: hashedPassword}
            );
            expect(auditActionSpy).toHaveBeenCalledWith(userWithEmptyPassword, 'registered');
            expect(auditServiceMock.create).toHaveBeenCalledWith("User with id 1 has been registered");
        });

        // Test cases for invalid user data
        const invalidUserTests = [
            { description: 'missing username', user: { username: 'testUser' } },
            { description: 'missing password', user: { password: 'password123' } },
            { description: 'empty', user: {} }
        ];

        invalidUserTests.forEach(({ description, user }) => {
            it(`should throw an error if user is ${description}`, async () => {
                // Act and assert that a StatusError is thrown
                await expect(userService.register(user)).rejects.toEqual(
                    expect.objectContaining({
                        status: 400, // Bad Request
                        name: expect.any(String)
                    } as StatusError)
                );

                /**
                 * Assert:
                 * - The validateObject was called with the correct parameters
                 * - The user repository was not called
                 * - The auditAction was not called
                 * - The password hash was not called
                 */
                expect(validateObjectSpy).toHaveBeenCalledWith(user, requiredValues);
                expect(userRepositoryMock.create).not.toHaveBeenCalled();
                expect(auditServiceMock.create).not.toHaveBeenCalled();
                expect(bcryptHashSpy).not.toHaveBeenCalled();
            });
        });
    });

    describe('login', () => {
        it('should successfully log in a user', async () => {
            // Arrange and mock service response
            const unHashedPassword = mockUser.password;
            const hashedPassword = await bcrypt.hash(mockUser.password, 10);
            const foundUser = { ...mockUser, id: 1, password: hashedPassword };
            const { password, ...userWithoutPassword } = foundUser;
            const userWithEmptyPassword = { ...userWithoutPassword, password: '' };
            const mockToken = 'mockToken';
            (userRepositoryMock.findByFields as jest.Mock).mockResolvedValueOnce(foundUser);
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            // Act
            const result = await userService.login(mockUser);

            /**
             * Assert:
             * - The user data and token were returned
             * - The validateObject was called with the correct parameters
             * - The password compare was called with the correct parameters
             * - The JWT sign was called with the correct parameters
             * - The user repository was called with the correct data
             * - The auditAction was called with the correct parameters
             * - The audit service was called with the correct parameters
             */
            expect(result).toEqual({ user: userWithoutPassword, token: mockToken });
            expect(validateObjectSpy).toHaveBeenCalledWith(mockUser, requiredValues);
            expect(bcryptCompareSpy).toHaveBeenCalledWith(unHashedPassword, hashedPassword);
            expect(jwtSignSpy).toHaveBeenCalledWith(userWithoutPassword, process.env.JWT_SECRET!, { expiresIn: expect.any(String) });
            expect(userRepositoryMock.findByFields).toHaveBeenCalledWith({ username: 'testUser' });
            expect(auditActionSpy).toHaveBeenCalledWith(userWithEmptyPassword, 'logged in');
            expect(auditServiceMock.create).toHaveBeenCalledWith("User with id 1 has been logged in");
        });

        it('should throw an error if username is incorrect', async () => {
            // Arrange and mock service response
            (userRepositoryMock.findByFields as jest.Mock).mockResolvedValueOnce(undefined); // User is not found

            // Act and assert that a StatusError is thrown
            await expect(userService.login(mockUser)).rejects.toEqual(
                expect.objectContaining({
                    status: 401,
                    name: expect.any(String)
                } as StatusError)
            );

            /**
             * Assert:
             * - The validateObject was called with the correct parameters
             * - The user repository was called with the correct data
             * - The password compare was not called
             * - The JWT sign was not called
             * - The audit service was not called
             */
            expect(validateObjectSpy).toHaveBeenCalledWith(mockUser, requiredValues);
            expect(userRepositoryMock.findByFields).toHaveBeenCalledWith({ username: 'testUser' });
            expect(bcryptCompareSpy).not.toHaveBeenCalled();
            expect(jwtSignSpy).not.toHaveBeenCalled();
            expect(auditServiceMock.create).not.toHaveBeenCalled();
        });

        it('should throw an error if password is incorrect', async () => {
            // Arrange and mock service response
            const unHashedPassword = mockUser.password;
            const hashedPassword = await bcrypt.hash(mockUser.password, 10);
            const foundUser = { ...mockUser, id: 1, password: hashedPassword };
            (userRepositoryMock.findByFields as jest.Mock).mockResolvedValueOnce(foundUser); // User is found

            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false); // Password comparison fails

            // Act and assert that a StatusError is thrown
            await expect(userService.login(mockUser)).rejects.toEqual(
                expect.objectContaining({
                    status: 401, // Unauthorized
                    name: expect.any(String)
                } as StatusError)
            );

            /**
             * Assert:
             * - The validateObject was called with the correct parameters
             * - The user repository was called with the correct data
             * - The password compare was called with the correct parameters
             * - The JWT sign was not called
             * - The audit service was not called
             */

            expect(validateObjectSpy).toHaveBeenCalledWith(mockUser, requiredValues);
            expect(userRepositoryMock.findByFields).toHaveBeenCalledWith({ username: 'testUser' });
            expect(bcryptCompareSpy).toHaveBeenCalledWith(unHashedPassword, hashedPassword);
            expect(jwtSignSpy).not.toHaveBeenCalled();
            expect(auditServiceMock.create).not.toHaveBeenCalled();
        });
    });
});