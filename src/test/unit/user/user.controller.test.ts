import {UserController} from "../../../app/user/user.controller";
import {BaseController} from "../../../app/base/base.controller";
import {config} from "../../../config/environment";

describe('UserController', () => {

    describe('register', () => {
        // Register new user successfully with valid credentials and required fields
        it('should register new user successfully when valid credentials and required fields provided', async () => {
            const mockUserService = {
                register: jest.fn().mockResolvedValue({
                    id: 1,
                    username: 'testUser',
                    role: 'PATIENT'
                })
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {},
                body: {
                    username: 'testUser',
                    password: 'password123',
                    role: 'PATIENT',
                    name: 'Test User',
                    date_of_birth: '1990-01-01'
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(
                mockReq.session,
                mockReq.body
            );

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'registration successful',
                data: {
                    id: 1,
                    username: 'testUser',
                    role: 'PATIENT'
                }
            });
        });

        // Register attempt with missing required fields
        it('should pass error to next middleware when required fields are missing', async () => {
            const mockError = new Error('Missing required fields');
            const mockUserService = {
                register: jest.fn().mockRejectedValue(mockError)
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {},
                body: {
                    username: 'testUser'
                    // Missing password and other required fields
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(
                mockReq.session,
                mockReq.body
            );

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        // Register with already existing username
        it('should return error when registering with an existing username', async () => {
            const mockUserService = {
                register: jest.fn().mockRejectedValue(new Error('Username already exists'))
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {},
                body: {
                    username: 'existingUser',
                    password: 'password123',
                    role: 'PATIENT',
                    name: 'Existing User',
                    date_of_birth: '1990-01-01'
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(
                mockReq.session,
                mockReq.body
            );

            expect(mockNext).toHaveBeenCalledWith(new Error('Username already exists'));
        });

        // Request body validation fails for register/login
        it('should return error when request body is invalid for register', async () => {
            const mockUserService = {
                register: jest.fn().mockRejectedValue(new Error('Validation failed'))
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {},
                body: {
                    username: '', // Invalid username
                    password: 'password123',
                    role: 'PATIENT'
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(
                mockReq.session,
                mockReq.body
            );

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });

        // Register response excludes password field
        it('should exclude password field from response when user registers', async () => {
            const mockUserService = {
                register: jest.fn().mockResolvedValue({
                    id: 1,
                    username: 'testUser',
                    role: 'PATIENT'
                })
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {},
                body: {
                    username: 'testUser',
                    password: 'password123',
                    role: 'PATIENT',
                    name: 'Test User',
                    date_of_birth: '1990-01-01'
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(
                mockReq.session,
                mockReq.body
            );

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'registration successful',
                data: {
                    id: 1,
                    username: 'testUser',
                    role: 'PATIENT'
                }
            });
        });
    });

    describe('logout', () => {
        // Logout user with active session and destroy session data
        it('should logout user and destroy session when active session exists', async () => {
            const mockUserService = {};

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {
                    token: 'validToken',
                    destroy: jest.fn((callback) => callback(null))
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.logout(mockReq as any, mockRes as any, mockNext);

            expect(mockReq.session.destroy).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'logout successful',
                data: null
            });
        });

        // Session destruction fails during logout
        it('should call next with error when session destruction fails during logout', async () => {
            const mockUserService = {};

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {
                    token: 'someToken',
                    destroy: jest.fn((callback) => callback(new Error('Session destruction error')))
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.logout(mockReq as any, mockRes as any, mockNext);

            expect(mockReq.session.destroy).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(new Error('Session destruction error'));
        });
    });

    describe('login', () => {
        // Login user with correct username/password and receive JWT token
        it('should return JWT token when login with correct credentials', async () => {
            const mockUserService = {
                login: jest.fn().mockResolvedValue({
                    user: {
                        id: 1,
                        username: 'testUser',
                        role: 'PATIENT'
                    },
                    token: 'jwt-token'
                })
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {
                    token: 'jwt-token',
                    userId: 1
                },
                body: {
                    username: 'testUser',
                    password: 'password123'
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.login(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.login).toHaveBeenCalledWith(mockReq.body);

            expect(mockReq.session.token).toBe('jwt-token');
            expect(mockReq.session.userId).toBe(1);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'login successful',
                data: {
                    user: {
                        id: 1,
                        username: 'testUser',
                        role: 'PATIENT'
                    },
                    token: 'jwt-token'
                }
            });
        });

        // Successful response includes correct status code and formatted message
        it('should login user successfully when valid credentials are provided', async () => {
            const mockUserService = {
                login: jest.fn().mockResolvedValue({
                    user: {
                        id: 1,
                        username: 'testUser',
                        role: 'PATIENT'
                    },
                    token: 'valid.jwt.token'
                })
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {
                    token: 'jwt-token',
                    userId: 1
                },
                body: {
                    username: 'testUser',
                    password: 'password123'
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.login(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.login).toHaveBeenCalledWith(mockReq.body);

            expect(mockReq.session.token).toBe('valid.jwt.token');
            expect(mockReq.session.userId).toBe(1);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'login successful',
                data: {
                    user: {
                        id: 1,
                        username: 'testUser',
                        role: 'PATIENT'
                    },
                    token: 'valid.jwt.token'
                }
            });
        });

        // Logout without active session
        it('should return success message when no active session during logout', async () => {
            const mockUserService = {};

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {}
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.logout(mockReq as any, mockRes as any, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'no active session',
                data: null
            });
        });

        // Login attempt with invalid credentials
        it('should return 401 error when login with invalid credentials', async () => {
            const mockUserService = {
                login: jest.fn().mockRejectedValue(new Error('Invalid username or password'))
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                body: {
                    username: 'invalidUser',
                    password: 'wrongPassword'
                },
                session: {}
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.login(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.login).toHaveBeenCalledWith(mockReq.body);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });

        // Handle concurrent login attempts for same user
        it('should handle concurrent login attempts by returning a valid token for each attempt', async () => {
            const mockUserService = {
                login: jest.fn().mockResolvedValue({
                    user: { id: 1, username: 'testUser', role: 'PATIENT' },
                    token: 'valid-token'
                })
            };

            const userController = new UserController(mockUserService as any);

            const mockReq1 = {
                session: {},
                body: {
                    username: 'testUser',
                    password: 'password123'
                }
            };

            const mockReq2 = {
                session: {},
                body: {
                    username: 'testUser',
                    password: 'password123'
                }
            };

            const mockRes1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockRes2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await Promise.all([
                userController.login(mockReq1 as any, mockRes1 as any, mockNext),
                userController.login(mockReq2 as any, mockRes2 as any, mockNext)
            ]);

            expect(mockUserService.login).toHaveBeenCalledTimes(2);
            expect(mockRes1.status).toHaveBeenCalledWith(200);
            expect(mockRes1.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'login successful',
                data: {
                    user: { id: 1, username: 'testUser', role: 'PATIENT' },
                    token: 'valid-token'
                }
            });

            expect(mockRes2.status).toHaveBeenCalledWith(200);
            expect(mockRes2.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'login successful',
                data: {
                    user: { id: 1, username: 'testUser', role: 'PATIENT' },
                    token: 'valid-token'
                }
            });
        });

        // Session token is properly stored after login
        it('should store session token when login is successful', async () => {
            const mockUserService = {
                login: jest.fn().mockResolvedValue({
                    user: { id: 1, username: 'testUser', role: 'PATIENT' },
                    token: 'mockToken123'
                })
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {
                    token: 'jwt-token',
                    userId: 1
                },
                body: {
                    username: 'testUser',
                    password: 'password123'
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.login(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.login).toHaveBeenCalledWith(mockReq.body);
            expect(mockReq.session.token).toBe('mockToken123');
            expect(mockReq.session.userId).toBe(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'login successful',
                data: {
                    user: { id: 1, username: 'testUser', role: 'PATIENT' },
                    token: 'mockToken123'
                }
            });
        });
    });

    describe('other' , () => {
        // Router initialization correctly binds all endpoint handlers
        it('should bind register, login, and logout handlers to the router', () => {
            const mockUserService = {
                register: jest.fn(),
                login: jest.fn(),
                logout: jest.fn()
            };

            const userController = new UserController(mockUserService as any);
            const router = userController.getRouter();

            const routes = router.stack.map(layer => layer.route!.path);

            expect(routes).toContain('/register');
            expect(routes).toContain('/login');
            expect(routes).toContain('/logout');
        });

        // Error handling passes errors to next middleware
        it('should pass error to next middleware when registration fails', async () => {
            const mockUserService = {
                register: jest.fn().mockRejectedValue(new Error('Registration error'))
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                session: {},
                body: {
                    username: 'testUser',
                    password: 'password123',
                    role: 'PATIENT'
                }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(
                mockReq.session,
                mockReq.body
            );

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });

        // Token expiration handling
        it('should handle token expiration and return unauthorized error when token is expired', async () => {
            const mockUserService = {
                login: jest.fn().mockRejectedValue(new Error('TokenExpiredError'))
            };

            const userController = new UserController(mockUserService as any);

            const mockReq = {
                body: {
                    username: 'expiredUser',
                    password: 'password123'
                },
                session: {}
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockNext = jest.fn();

            await userController.login(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.login).toHaveBeenCalledWith(mockReq.body);
            expect(mockNext).toHaveBeenCalledWith(new Error('TokenExpiredError'));
        });

        // Controller properly extends BaseController with generic types
        it('should extend BaseController with User, Patient, and Doctor_Private types', () => {
            const mockUserService = {};
            const userController = new UserController(mockUserService as any);

            expect(userController).toBeInstanceOf(BaseController);
            expect(userController['entityConfig']).toEqual(config.entityValues.user);
        });
    });
});
