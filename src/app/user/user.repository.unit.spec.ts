import 'reflect-metadata';
import { Container } from 'typedi';
import { UserRepository } from './user.repository';
import { DatabaseService } from '../../database/database.service';
import { User } from './user.model';

describe('UserRepository Unit Tests', () => {
    // Test fixtures
    let userRepository: UserRepository;
    let databaseServiceMock: DatabaseService;

    beforeEach(() => {
        // Reset container and initialize mocks
        Container.reset();

        // Setup service mocks
        databaseServiceMock = {
            execQuery: jest.fn(),
        } as unknown as DatabaseService;

        // Register mocks in the container
        Container.set(DatabaseService, databaseServiceMock);

        // Initialize repository using the container
        userRepository = Container.get(UserRepository);
    });

    afterEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('findByFields', () => {
        it('should return a user when a matching username is found', async () => {
            // Arrange
            const mockUser: User = { id: 1, username: 'testUser', password: 'password123' };
            const queryResult = { rows: [mockUser] };
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce(queryResult);

            // Act
            const result = await userRepository.findByFields({ username: 'testUser' });

            /**
             * Assert:
             * - The result should be the mock user
             * - The execQuery method should have been called with the correct query document
             */
            expect(result).toEqual(mockUser);
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith({
                sql: 'SELECT * FROM users WHERE username = ?',
                params: ['testUser']
            });
        });

        it('should return undefined when no matching username is found', async () => {
            // Arrange
            const queryResult = { rows: [] };
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce(queryResult);

            // Act
            const result = await userRepository.findByFields({ username: 'nonExistentUser' });

            /**
             * Assert:
             * - The result should be undefined
             * - The execQuery method should have been called with the correct query document
             */
            expect(result).toBeUndefined();
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith({
                sql: 'SELECT * FROM users WHERE username = ?',
                params: ['nonExistentUser']
            });
        });
    });
});