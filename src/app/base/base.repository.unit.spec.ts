import 'reflect-metadata';
import { Container } from 'typedi';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../../database/database.service';
import { EntityConfig } from './base.model';
import { config } from '../../config/environment';

interface TestEntity {
    id?: number;
    [key: string]: any;
}

class TestRepository extends BaseRepository<TestEntity> {
    protected entityConfig: EntityConfig<TestEntity> = config.entityValues.test;

    constructor(protected databaseService: DatabaseService) {
        super(databaseService);
    }
}

describe('BaseRepository Unit Tests', () => {
    // Test fixtures
    let repository: TestRepository;
    let databaseServiceMock: DatabaseService;
    let mockEntity: TestEntity = config.entityValues.test.defaultEntity;
    let existsSpy: jest.SpyInstance;
    let existsByIdSpy: jest.SpyInstance;
    let findByIdSpy: jest.SpyInstance;
    let findByFieldsSpy: jest.SpyInstance;

    beforeEach(() => {
        // Reset container & initialize mocks
        Container.reset();

        // Setup service mocks
        databaseServiceMock = {
            execQuery: jest.fn()
        } as unknown as DatabaseService;

        // Register mocks in the container
        Container.set(DatabaseService, databaseServiceMock);

        // Initialize repository using the container
        repository = new TestRepository(databaseServiceMock);

        // Setup spies
        existsSpy = jest.spyOn(repository, 'exists');
        existsByIdSpy = jest.spyOn(repository, 'existsById');
        findByIdSpy = jest.spyOn(repository, 'findById');
        findByFieldsSpy = jest.spyOn(repository, 'findByFields');
    });

    afterEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Create', () => {
        it('should successfully create an entity', async () => {
            // Arrange & mock the databaseService.execQuery method
            let id = 1;
            let retrievedEntity = { ...mockEntity, id };
            (repository.exists as jest.Mock).mockResolvedValueOnce(false);
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: [retrievedEntity] });

            // Act
            const result = await repository.create(mockEntity);

            /**
             * Assert:
             * - The result should be the retrieved entity
             * - The exists method should have been called with the entity
             * - The execQuery method should have been called with the correct query document
             */
            expect(result).toEqual(retrievedEntity);
            expect(existsSpy).toHaveBeenCalledWith(mockEntity);
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith(expect.objectContaining({
                sql: expect.any(String),
                params: expect.any(Array)
            }));

        });

        it('should throw an error if entity already exists', async () => {
            // Arrange & mock the repository.exists method
            (repository.exists as jest.Mock).mockResolvedValueOnce(true);

            // Act & Assert that an error is thrown
            await expect(repository.create(mockEntity)).rejects.toThrow(Error);

            /**
             * Assert:
             * - The exists method should have been called with the entity
             * - The execQuery method should not have been called
             */
            expect(existsSpy).toHaveBeenCalledWith(mockEntity);
            expect(databaseServiceMock.execQuery).not.toHaveBeenCalled();
        });
    });

    describe('Update', () => {
        it('should successfully update an entity', async () => {
            // Arrange & mock the databaseService.execQuery method
            let id = 1;
            let updates = { field1: 'updated' };
            let updatedEntity = { ...mockEntity, ...updates, id };

            (repository.existsById as jest.Mock).mockResolvedValueOnce(true);
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: [updatedEntity]});

            // Act
            const result = await repository.update(id, updates);

            /**
             * Assert:
             * - The result should be the updated entity
             * - The existsById method should have been called with the id
             * - The execQuery method should have been called with the correct query document
             */
            expect(result).toEqual(updatedEntity);
            expect(existsByIdSpy).toHaveBeenCalledWith(id);
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith(expect.objectContaining({
                sql: expect.any(String),
                params: expect.any(Array)
            }));
        });

        it('should throw an error if entity does not exist', async () => {
            // Arrange
            let id = 1;
            let updates = { field1: 'updated' };
            (repository.existsById as jest.Mock).mockResolvedValueOnce(false);

            // Act & Assert that an error is thrown
            await expect(repository.update(id, updates)).rejects.toThrow(Error);

            /**
             * Assert:
             * - The existsById method should have been called with the id
             * - The execQuery method should not have been called
             */
            expect(existsByIdSpy).toHaveBeenCalledWith(id);
            expect(databaseServiceMock.execQuery).not.toHaveBeenCalled();
        });
    });

    describe('Delete', () => {
        it('should successfully delete an entity', async () => {
            // Arrange
            let id = 1;
            let retrievedEntity = { ...mockEntity, id };
            (repository.findById as jest.Mock).mockResolvedValueOnce(retrievedEntity);
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: [retrievedEntity] });

            // Act
            const result = await repository.delete(id);

            /**
             * Assert:
             * - The result should be the retrieved entity
             * - The findById method should have been called with the id
             * - The execQuery method should have been called with the correct query document
             */
            expect(result).toEqual(retrievedEntity);
            expect(existsByIdSpy).toHaveBeenCalledWith(id);
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith(expect.objectContaining({
                sql: expect.any(String),
                params: expect.any(Array)
            }));
        });

        it('should throw an error if entity does not exist', async () => {
            // Arrange
            let id = 1;
            (repository.findById as jest.Mock).mockResolvedValueOnce(null);

            // Act & Assert that an error is thrown
            await expect(repository.delete(id)).rejects.toThrow(Error);

            /**
             * Assert:
             * - The findById method should have been called with the id
             * - The execQuery method should not have been called
             */
            expect(findByIdSpy).toHaveBeenCalledWith(id);
            expect(databaseServiceMock.execQuery).not.toHaveBeenCalled();
        });
    });

    describe('FindAll', () => {
        it('should successfully retrieve all entities', async () => {
            // Arrange
            let entities = [mockEntity];
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: entities });

            // Act
            const result = await repository.findAll();

            /**
             * Assert:
             * - The result should be the retrieved entities
             * - The execQuery method should have been called with the correct query document
             */
            expect(result).toEqual(entities);
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith(expect.objectContaining({
                sql: expect.any(String)
            }));
        });

        it('should return an empty array if no entities are found', async () => {
            // Arrange
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: [] });

            // Act
            const result = await repository.findAll();

            /**
             * Assert:
             * - The result should be an empty array
             */
            expect(result).toEqual([]);
        });
    });

    describe('FindById', () => {
        it('should successfully retrieve an entity by id', async () => {
            // Arrange
            let id = 1;
            let retrievedEntity = { ...mockEntity, id };
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: [retrievedEntity] });

            // Act
            const result = await repository.findById(id);

            /**
             * Assert:
             * - The result should be the retrieved entity
             * - The execQuery method should have been called with the correct query document
             */
            expect(result).toEqual(retrievedEntity);
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith(expect.objectContaining({
                sql: expect.any(String),
                params: expect.any(Array)
            }));
        });

        it('should return null if entity is not found', async () => {
            // Arrange
            let id = 1;
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: [] });

            // Act
            const result = await repository.findById(id);

            /**
             * Assert:
             * - The result should be null
             */
            expect(result).toBeNull();
        });
    });

    describe('ExistsById', () => {
        it('should return true if entity exists', async () => {
            // Arrange
            let id = 1;
            let retrievedEntity = { ...mockEntity, id };
            (repository.findById as jest.Mock).mockResolvedValueOnce({ rows: [retrievedEntity] });

            // Act
            const result = await repository.existsById(id);

            /**
             * Assert:
             * - The result should be true
             * - The findById method should have been called with the id
             */
            expect(result).toBe(true);
            expect(findByIdSpy).toHaveBeenCalledWith(id);
        });

        it('should return false if entity does not exist', async () => {
            // Arrange
            let id = 1;
            (repository.findById as jest.Mock).mockResolvedValueOnce(null);

            // Act
            const result = await repository.existsById(id);

            /**
             * Assert:
             * - The result should be false
             * - The findById method should have been called with the id
             */
            expect(result).toBe(false);
            expect(findByIdSpy).toHaveBeenCalledWith(id);
        });
    });

    describe('FindByFields', () => {
        it('should successfully retrieve an entity by fields', async () => {
            // Arrange
            let fields = { field1: mockEntity['field1'] } as Partial<TestEntity>;
            let retrievedEntity = { ...mockEntity, id: 1};
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: [retrievedEntity] });

            // Act
            const result = await repository.findByFields(fields);

            // Assert
            expect(result).toEqual(retrievedEntity);
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith(expect.objectContaining({
                sql: expect.any(String),
                params: expect.any(Array)
            }));
        });

        it('should return undefined if entity is not found', async () => {
            // Arrange
            let fields = { field1: mockEntity['field1'] } as Partial<TestEntity>;
            (databaseServiceMock.execQuery as jest.Mock).mockResolvedValueOnce({ rows: [] });

            // Act
            const result = await repository.findByFields(fields);

            /**
             * Assert:
             * - The result should be undefined
             * - The execQuery method should have been called with the correct query document
             */
            expect(result).toBeUndefined();
            expect(databaseServiceMock.execQuery).toHaveBeenCalledWith(expect.objectContaining({
                sql: expect.any(String),
                params: expect.any(Array)
            }));
        });
    });

    describe('Exists', () => {
        it('should return true if entity exists', async () => {
            // Arrange
            let fields = { field1: mockEntity['field1'] } as Partial<TestEntity>;
            (repository.findByFields as jest.Mock).mockResolvedValueOnce(mockEntity);

            // Act
            const result = await repository.exists(fields);

            /**
             * Assert:
             * - The result should be true
             * - The findByFields method should have been called with the fields
             */
            expect(result).toBe(true);
            expect(repository.findByFields).toHaveBeenCalledWith(fields);
        });

        it('should return false if entity does not exist', async () => {
            // Arrange
            let fields = { field1: mockEntity['field1'] } as Partial<TestEntity>;
            (repository.findByFields as jest.Mock).mockResolvedValueOnce(undefined);

            // Act
            const result = await repository.exists(fields);

            /**
             * Assert:
             * - The result should be false
             * - The findByFields method should have been called with the fields
             */
            expect(result).toBe(false);
            expect(repository.findByFields).toHaveBeenCalledWith(fields);
        });
    });
});