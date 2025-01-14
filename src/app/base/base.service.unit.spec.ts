import 'reflect-metadata';
import { Container } from 'typedi';
import { BaseService } from './base.service';
import { BaseRepository } from './base.repository';
import { LogService } from '../log/log.service';
import { StatusError } from '../../utils/status_error';
import { EntityConfig } from './base.model';
import * as validationUtils from "../../utils/validation";
import { config } from '../../config/environment';

interface TestEntity {
    id?: number;
    [key: string]: any;
}

class TestService extends BaseService<TestEntity> {
    protected entityConfig: EntityConfig<TestEntity> = config.entityValues.test;

    constructor(
        protected auditService: LogService,
        protected repository: BaseRepository<TestEntity>
    ) {
        super(auditService, repository);
    }
}

describe('BaseService Unit Tests', () => {
    // Test fixtures
    let service: TestService;
    let repositoryMock: BaseRepository<TestEntity>;
    let auditServiceMock: LogService;
    let auditActionSpy: jest.SpyInstance;
    let validateObjectSpy: jest.SpyInstance;
    let validatePartialObjectSpy: jest.SpyInstance;
    let validateRequiredParamsSpy: jest.SpyInstance;
    let requiredValues = config.entityValues.test.requiredFields;
    const mockEntity: TestEntity = config.entityValues.test.defaultEntity;

    beforeEach(() => {
        // Reset container & initialize mocks
        Container.reset();

        // Setup service mocks
        repositoryMock = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn()
        } as unknown as BaseRepository<TestEntity>;

        auditServiceMock = {
            create: jest.fn()
        } as unknown as LogService;

        // Register mocks in the container
        Container.set(BaseRepository, repositoryMock);
        Container.set(LogService, auditServiceMock);

        // Initialize service using the container
        service = new TestService(auditServiceMock, repositoryMock);

        // Setup spies
        validateObjectSpy = jest.spyOn(validationUtils, 'validateObject');
        validatePartialObjectSpy = jest.spyOn(validationUtils, 'validatePartialObject');
        validateRequiredParamsSpy = jest.spyOn(validationUtils, 'validateRequiredParams');
        auditActionSpy = jest.spyOn(service, 'auditAction');
    });

    afterEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Create', () => {
        it('should successfully create an entity', async () => {
            // Arrange & mock the repository response
            const createdEntity = { ...mockEntity, id: 1 };
            (repositoryMock.create as jest.Mock).mockResolvedValue(createdEntity);

            // Act
            const result = await service.create(mockEntity);

            /**
             * Assert:
             * - The result is the created entity
             * - The validation function was called with the correct parameters
             * - The auditAction function was called with the correct parameters
             * - The repository create function was called with the correct parameters
             * - The auditService create function was called with the correct parameters
             */
            expect(result).toEqual(createdEntity);
            expect(validateObjectSpy).toHaveBeenCalledWith(mockEntity, requiredValues);
            expect(auditActionSpy).toHaveBeenCalledWith(createdEntity, 'created');
            expect(repositoryMock.create).toHaveBeenCalledWith(mockEntity);
            expect(auditServiceMock.create).toHaveBeenCalledWith('TestEntity with id 1 has been created');
        });

        // Test cases for invalid entity data
        const invalidEntityTests = [
            { description: 'missing field1', entity: (() => { const e = { ...mockEntity }; delete e.field1; return e; })() },
            { description: 'missing field2', entity: (() => { const e = { ...mockEntity }; delete e.field2; return e; })() },
            { description: 'missing field3', entity: (() => { const e = { ...mockEntity }; delete e.field3; return e; })() },
            { description: 'empty', entity: {} }
        ];

        invalidEntityTests.forEach(({ description, entity }) => {
            it(`should throw an error if entity is ${description}`, async () => {
                // Act & assert that a StatusError is thrown
                await expect(service.create(entity)).rejects.toEqual(
                    expect.objectContaining({
                        status: 400, // Bad Request
                        name: expect.any(String)
                    } as StatusError)
                );

                /**
                 * Assert:
                 * - The validation function was called with the correct parameters
                 * - The auditAction function was not called
                 */
                expect(repositoryMock.create).not.toHaveBeenCalled();
                expect(auditActionSpy).not.toHaveBeenCalled();
            });
        });
    });

    describe('Update', () => {
        it('should successfully update an entity', async () => {
            // Arrange & mock the repository response
            const id = 1;
            const updates = { field1: 'modifiedField' };
            const updatedEntity = { ...mockEntity, ...updates, id };
            (repositoryMock.update as jest.Mock).mockResolvedValue(updatedEntity);

            // Act
            const result = await service.update(id, updates);

            /**
             * Assert:
             * - The result is the updated entity
             * - The validation of parameters function was called with the id
             * - The validateObject function was not called as the updates don't have to be a full entity
             * - The validatePartialObject function was called with the correct parameters
             * - The auditAction function was called with the correct parameters
             * - The repository update function was called with the correct parameters
             * - The auditService create function was called with the correct parameters
             */
            expect(validateRequiredParamsSpy).toHaveBeenCalledWith({ id });
            expect(validateObjectSpy).not.toHaveBeenCalled();
            expect(validatePartialObjectSpy).toHaveBeenCalledWith(updates, requiredValues);
            expect(result).toEqual(updatedEntity);
            expect(repositoryMock.update).toHaveBeenCalledWith(1, updates);
            expect(auditServiceMock.create).toHaveBeenCalledWith('TestEntity with id 1 has been updated');
        });
    });

    describe('Delete', () => {
        it('should successfully delete an entity', async () => {
            // Arrange & mock the repository response
            const id = 1;
            const deletedEntity = { ...mockEntity, id };
            (repositoryMock.delete as jest.Mock).mockResolvedValue(deletedEntity);

            // Act
            const result = await service.delete(id);

            /**
             * Assert:
             * - The result is the deleted entity
             * - The repository delete function was called with the correct parameters
             * - The validateRequiredParams function was called with the correct parameters
             * - The auditAction function was called with the correct parameters
             * - The auditService create function was called with the correct parameters
             */
            expect(result).toEqual(deletedEntity);
            expect(repositoryMock.delete).toHaveBeenCalledWith(1);
            expect(validateRequiredParamsSpy).toHaveBeenCalledWith({ id });
            expect(auditActionSpy).toHaveBeenCalledWith(deletedEntity, 'deleted');
            expect(auditServiceMock.create).toHaveBeenCalledWith('TestEntity with id ' + id + ' has been deleted');
        });
    });

    describe('GetAll', () => {
        it('should successfully retrieve all entities', async () => {
            // Arrange & mock the repository response
            const numberOfEntities = 5;
            const mockEntities = Array.from({ length: numberOfEntities }, (_, i) => ({ ...mockEntity, id: i + 1 }));
            (repositoryMock.findAll as jest.Mock).mockResolvedValue(mockEntities);

            // Act
            const result = await service.getAll();

            /**
             * Assert:
             * - The result is the list of entities
             * - The repository findAll function was called
             * - The auditAction function was called with the correct parameters
             * - The auditService create function was called once with the array of entities
             * - The auditService create function was called once for each entity
             */
            expect(result).toEqual(mockEntities);
            expect(repositoryMock.findAll).toHaveBeenCalled();
            expect(auditActionSpy).toHaveBeenCalledWith(mockEntities, 'retrieved');
            expect(auditServiceMock.create).toHaveBeenCalledTimes(numberOfEntities);
        });
    });

    describe('GetById', () => {
        it('should successfully retrieve an entity by id', async () => {
            // Arrange & mock the repository response
            const id = 1;
            const foundEntity = { ...mockEntity, id };
            (repositoryMock.findById as jest.Mock).mockResolvedValue(foundEntity);

            // Act
            const result = await service.getById(id);

            /**
             * Assert:
             * - The result is the found entity
             * - The repository findById function was called with the correct parameters
             * - The auditAction function was called with the correct parameters
             * - The auditService create function was called with the correct parameters
             */
            expect(result).toEqual(foundEntity);
            expect(repositoryMock.findById).toHaveBeenCalledWith(id);
            expect(auditActionSpy).toHaveBeenCalledWith(foundEntity, 'retrieved');
            expect(auditServiceMock.create).toHaveBeenCalledWith('TestEntity with id ' + id + ' has been retrieved');
        });

        it('should throw an error if the entity is not found', async () => {
            // Arrange & mock the repository response
            const id = 1;
            (repositoryMock.findById as jest.Mock).mockResolvedValue(null);

            // Act & assert that a StatusError is thrown
            await expect(service.getById(id)).rejects.toEqual(
                expect.objectContaining({
                    status: 404, // Not Found
                    name: expect.any(String)
                } as StatusError)
            );

            /**
             * Assert:
             * - The validateRequiredParams function was called with the correct parameters
             * - The repository findById function was called with the correct parameters
             * - The auditAction function was not called
             */
            expect(validateRequiredParamsSpy).toHaveBeenCalledWith({ id });
            expect(repositoryMock.findById).toHaveBeenCalledWith(id);
            expect(auditActionSpy).not.toHaveBeenCalled();
        });
    });
});