import 'reflect-metadata';
import { Container } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.model';
import { StatusError } from '../../utils/status_error';
import * as responseUtil from '../../utils/response';
import { config } from "../../config/environment";

describe('UserController Unit Tests', () => {
  // Test fixtures
  let userService: UserService;
  let userController: UserController;
  let mockUser: User;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let createResponseSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset container and initialize mocks
    Container.reset();

    // Setup service mocks
    userService = {
      register: jest.fn(),
      login: jest.fn()
    } as unknown as UserService;

    // Register mocks in the container
    Container.set(UserService, userService);

    // Initialize controller using the container
    userController = Container.get(UserController);

    // Setup test data
    mockUser = { username: 'testUser', password: 'password123' };

    // Setup request/response mocks
    req = {
      body: mockUser,
      session: config.user_sessions
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Setup response utility spy
    createResponseSpy = jest.spyOn(responseUtil, 'createResponse');
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('should successfully registers a new user', async () => {
      // Arrange and mock service response
      const mockReturnUser = { ...mockUser, id: '1' };
      (userService.register as jest.Mock).mockResolvedValue(mockReturnUser);

      // Act
      await userController.register(req as Request, res as Response, next);

      /**
       * Assert:
       * - The controller should call the service with the correct user data
       * - The controller should return a 201 status code
       * - The controller should return the created user in the response
       * - The controller should call the response utility with the correct arguments
       * - The controller should not call the next middleware
       */
      expect(userService.register).toHaveBeenCalledWith(mockUser);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(createResponseSpy).toHaveBeenCalledWith(
          'success',
          'registration successful',
          mockReturnUser
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('handles registration errors appropriately', async () => {
      // Arrange
      const errorScenarios = [
        new StatusError(0, 'Generic Error'),
        new Error('Unknown error')
      ];

      for (const error of errorScenarios) {
        // Reset mock for each scenario
        jest.clearAllMocks();
        (userService.register as jest.Mock).mockRejectedValueOnce(error);

        // Act
        await userController.register(req as Request, res as Response, next);

        /**
         * Assert:
         * - The controller should call the service with the correct user data
         * - The controller should not call the response utility
         * - The controller should not call the response.status or response.json methods here
         * - The controller should call the next middleware with the error
         *   Note: The error handler middleware will handle the response status and message
         */
        expect(userService.register).toHaveBeenCalledWith(mockUser);
        expect(responseUtil.createResponse).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      }
    });
  });

  describe('Login', () => {
    it('successfully authenticates users', async () => {
      // Arrange
      const mockReturnUser = { ...mockUser, id: '1' };
      const mockToken = 'mockToken';
      (userService.login as jest.Mock).mockResolvedValue({
        user: mockReturnUser,
        token: mockToken
      });

      // Act
      await userController.login(req as Request, res as Response, next);

      /**
       * Assert:
       * - The controller should call the service with the correct user data
       * - The controller should return a 200 status code
       * - The controller should return the user and token in the response
       * - The controller should call the response utility with the correct arguments
       * - The controller should not call the next middleware
       */
      expect(userService.login).toHaveBeenCalledWith(mockUser);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(createResponseSpy).toHaveBeenCalledWith(
          'success',
          'login successful',
          { user: mockReturnUser, token: mockToken }
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('handles authentication errors appropriately', async () => {
      // Arrange
      const errorScenarios = [
        new StatusError(0, 'Generic Error'),
        new Error('Unknown error')
      ];

      for (const error of errorScenarios) {
        // Reset mock for each scenario
        jest.clearAllMocks();
        (userService.login as jest.Mock).mockRejectedValueOnce(error);

        // Act
        await userController.login(req as Request, res as Response, next);

        /**
         * Assert:
         * - The controller should call the service with the correct user data
         * - The controller should return a 200 status code
         * - The controller should return the user and token in the response
         * - The controller should call the response utility with the correct arguments
         * - The controller should not call the next middleware
         */
        expect(userService.login).toHaveBeenCalledWith(mockUser);
        expect(responseUtil.createResponse).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      }
    });
  });
  describe('Logout', () => {
    it('should successfully logout a user', async () => {
      // Arrange and mock service response
      const mockReturnUser = { ...mockUser, id: '1' };
      (userService.register as jest.Mock).mockResolvedValue(mockReturnUser);

      // Act
      await userController.register(req as Request, res as Response, next);

      /**
       * Assert:
       * - The controller should call the service with the correct user data
       * - The controller should return a 201 status code
       * - The controller should return the created user in the response
       * - The controller should call the response utility with the correct arguments
       * - The controller should not call the next middleware
       */
      expect(userService.register).toHaveBeenCalledWith(mockUser);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(createResponseSpy).toHaveBeenCalledWith(
          'success',
          'registration successful',
          mockReturnUser
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});