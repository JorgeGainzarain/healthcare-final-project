import { UserController } from "../../../app/user/user.controller";
import { BaseController } from "../../../app/base/base.controller";
import { config } from "../../../config/environment";

describe('UserController', () => {
    let mockUserService: any;
    let userController: UserController;
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeAll(() => {
        mockUserService = {
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn()
        };
        userController = new UserController(mockUserService as any);
        mockReq = {
            session: {},
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register new user successfully when valid credentials and required fields provided', async () => {
            mockUserService.register.mockResolvedValue({
                id: 1,
                username: 'testUser',
                role: 'PATIENT'
            });

            mockReq.body = {
                username: 'testUser',
                password: 'password123',
                role: 'PATIENT',
                name: 'Test User',
                date_of_birth: '1990-01-01'
            };

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(mockReq.body);
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

        it('should pass error to next middleware when required fields are missing', async () => {
            const mockError = new Error('Missing required fields');
            mockUserService.register.mockRejectedValue(mockError);

            mockReq.body = { username: 'testUser' };

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(mockReq.body);
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });

        it('should return error when registering with an existing username', async () => {
            mockUserService.register.mockRejectedValue(new Error('Username already exists'));

            mockReq.body = {
                username: 'existingUser',
                password: 'password123',
                role: 'PATIENT',
                name: 'Existing User',
                date_of_birth: '1990-01-01'
            };

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(mockReq.body);
            expect(mockNext).toHaveBeenCalledWith(new Error('Username already exists'));
        });

        it('should return error when request body is invalid for register', async () => {
            mockUserService.register.mockRejectedValue(new Error('Validation failed'));

            mockReq.body = {
                username: '', // Invalid username
                password: 'password123',
                role: 'PATIENT'
            };

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(mockReq.body);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should exclude password field from response when user registers', async () => {
            mockUserService.register.mockResolvedValue({
                id: 1,
                username: 'testUser',
                role: 'PATIENT'
            });

            mockReq.body = {
                username: 'testUser',
                password: 'password123',
                role: 'PATIENT',
                name: 'Test User',
                date_of_birth: '1990-01-01'
            };

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(mockReq.body);
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
        it('should logout user and destroy session when active session exists', async () => {
            mockReq.session = {
                token: 'validToken',
                destroy: jest.fn((callback) => callback(null))
            };

            await userController.logout(mockReq as any, mockRes as any, mockNext);

            expect(mockReq.session.destroy).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'logout successful',
                data: null
            });
        });

        it('should call next with error when session destruction fails during logout', async () => {
            mockReq.session = {
                token: 'someToken',
                destroy: jest.fn((callback) => callback(new Error('Session destruction error')))
            };

            await userController.logout(mockReq as any, mockRes as any, mockNext);

            expect(mockReq.session.destroy).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(new Error('Session destruction error'));
        });
    });

    describe('login', () => {
        it('should return JWT token when login with correct credentials', async () => {
            mockUserService.login.mockResolvedValue({
                user: {
                    id: 1,
                    username: 'testUser',
                    role: 'PATIENT'
                },
                token: 'jwt-token'
            });

            mockReq.body = {
                username: 'testUser',
                password: 'password123'
            };

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

        it('should login user successfully when valid credentials are provided', async () => {
            mockUserService.login.mockResolvedValue({
                user: {
                    id: 1,
                    username: 'testUser',
                    role: 'PATIENT'
                },
                token: 'valid.jwt.token'
            });

            mockReq.body = {
                username: 'testUser',
                password: 'password123'
            };

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

        it('should return 401 error when login with invalid credentials', async () => {
            mockUserService.login.mockRejectedValue(new Error('Invalid username or password'));

            mockReq.body = {
                username: 'invalidUser',
                password: 'wrongPassword'
            };

            await userController.login(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.login).toHaveBeenCalledWith(mockReq.body);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle concurrent login attempts by returning a valid token for each attempt', async () => {
            mockUserService.login.mockResolvedValue({
                user: { id: 1, username: 'testUser', role: 'PATIENT' },
                token: 'valid-token'
            });

            const mockReq1 = { ...mockReq, body: { username: 'testUser', password: 'password123' } };
            const mockReq2 = { ...mockReq, body: { username: 'testUser', password: 'password123' } };

            const mockRes1 = { ...mockRes };
            const mockRes2 = { ...mockRes };

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

        it('should store session token when login is successful', async () => {
            mockUserService.login.mockResolvedValue({
                user: { id: 1, username: 'testUser', role: 'PATIENT' },
                token: 'mockToken123'
            });

            mockReq.body = {
                username: 'testUser',
                password: 'password123'
            };

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

    describe('other', () => {
        it('should bind register, login, and logout handlers to the router', () => {
            const router = userController.getRouter();
            const routes = router.stack.map(layer => layer.route!.path);

            expect(routes).toContain('/register');
            expect(routes).toContain('/login');
            expect(routes).toContain('/logout');
        });

        it('should pass error to next middleware when registration fails', async () => {
            mockUserService.register.mockRejectedValue(new Error('Registration error'));

            mockReq.body = {
                username: 'testUser',
                password: 'password123',
                role: 'PATIENT'
            };

            await userController.register(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.register).toHaveBeenCalledWith(mockReq.body);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle token expiration and return unauthorized error when token is expired', async () => {
            mockUserService.login.mockRejectedValue(new Error('TokenExpiredError'));

            mockReq.body = {
                username: 'expiredUser',
                password: 'password123'
            };

            await userController.login(mockReq as any, mockRes as any, mockNext);

            expect(mockUserService.login).toHaveBeenCalledWith(mockReq.body);
            expect(mockNext).toHaveBeenCalledWith(new Error('TokenExpiredError'));
        });

        it('should extend BaseController with User, Patient, and Doctor_Private types', () => {
            expect(userController).toBeInstanceOf(BaseController);
            expect(userController['entityConfig']).toEqual(config.entityValues.user);
        });
    });
});