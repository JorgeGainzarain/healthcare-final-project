import 'reflect-metadata';
import { Container } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { BaseService } from './base.service';
import { StatusError } from '../../utils/status_error';
import * as responseUtil from '../../utils/response';
import { config } from '../../config/environment';
import { EntityConfig } from './base.model';

interface TestEntity {
    id?: number;
    [key: string]: any;
}

class GenericController extends BaseController<TestEntity> {
    protected entityConfig: EntityConfig<TestEntity> = config.entityValues.test;

    constructor(service: BaseService<TestEntity>) {
        super(service);
    }
}

describe('BaseController Unit Tests', () => {
    // Test fixtures
    let service: BaseService<TestEntity>;
    let controller: GenericController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let createResponseSpy: jest.SpyInstance;
    const mockEntity: TestEntity = config.entityValues.test.defaultEntity;

    beforeEach(() => {
        // Reset container and initialize mocks
        Container.reset();

        // Setup service mocks
        service = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            getById: jest.fn()
        } as unknown as BaseService<TestEntity>;

        // Initialize controller using the container
        controller = new GenericController(service);

        // Setup request/response mocks
        req = {
            body: { field1: 'test1', field2: 'test2' },
            params: { id: '1' }
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

    describe('Create', () => {
        it('successfully creates an entity', async () => {
            // Arrange
            (service.create as jest.Mock).mockResolvedValue(mockEntity);

            // Act
            await controller.create(req as Request, res as Response, next);

            /**
             * Assert:
             * - The controller should call the service with the correct entity data
             * - The controller should return a 201 status code
             * - The controller should return the created entity in the response
             * - The controller should call the response utility with the correct arguments
             * - The controller should not call the next middleware
             */
            expect(service.create).toHaveBeenCalledWith({ field1: 'test1', field2: 'test2' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalled();
            expect(createResponseSpy).toHaveBeenCalledWith(
                'success',
                'TestEntity created successfully',
                mockEntity
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('handles creation errors appropriately', async () => {
            // Arrange
            const errorScenarios = [
                new StatusError(0, 'Generic Error'),
                new Error('Unknown error')
            ];

            for (const error of errorScenarios) {
                // Reset mock for each scenario
                jest.clearAllMocks();
                (service.create as jest.Mock).mockRejectedValueOnce(error);

                // Act
                await controller.create(req as Request, res as Response, next);

                /**
                 * Assert:
                 * - The controller should call the service with the correct entity data
                 * - The controller should not call the response utility
                 * - The controller should not call the response.status or response.json methods here
                 * - The controller should call the next middleware with the error
                 *   Note: The error handler middleware will handle the response status and message
                 */
                expect(service.create).toHaveBeenCalledWith({ field1: 'test1', field2: 'test2' });
                expect(responseUtil.createResponse).not.toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
                expect(res.json).not.toHaveBeenCalled();
                expect(next).toHaveBeenCalledWith(error);
            }
        });
    });

    describe('Update', () => {
        it('successfully updates an entity', async () => {
            // Arrange
            (service.update as jest.Mock).mockResolvedValue(mockEntity);

            // Act
            await controller.update(req as Request, res as Response, next);

            /**
             * Assert:
             * - The controller should call the service with the correct entity data
             * - The controller should return a 200 status code
             * - The controller should return the updated entity in the response
             * - The controller should call the response utility with the correct arguments
             * - The controller should not call the next middleware
             */
            expect(service.update).toHaveBeenCalledWith(1, { field1: 'test1', field2: 'test2' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(createResponseSpy).toHaveBeenCalledWith(
                'success',
                'TestEntity updated successfully',
                mockEntity
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('handles update errors appropriately', async () => {
            // Arrange
            const errorScenarios = [
                new StatusError(0, 'Generic Error'),
                new Error('Unknown error')
            ];

            for (const error of errorScenarios) {
                // Reset mock for each scenario
                jest.clearAllMocks();
                (service.update as jest.Mock).mockRejectedValueOnce(error);

                // Act
                await controller.update(req as Request, res as Response, next);

                /**
                 * Assert:
                 * - The controller should call the service with the correct entity data
                 * - The controller should not call the response utility
                 * - The controller should not call the response.status or response.json methods here
                 * - The controller should call the next middleware with the error
                 *   Note: The error handler middleware will handle the response status and message
                 */
                expect(service.update).toHaveBeenCalledWith(1, { field1: 'test1', field2: 'test2' });
                expect(responseUtil.createResponse).not.toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
                expect(res.json).not.toHaveBeenCalled();
                expect(next).toHaveBeenCalledWith(error);
            }
        });
    });

    describe('Delete', () => {
        it('successfully deletes an entity', async () => {
            // Arrange
            (service.delete as jest.Mock).mockResolvedValue(mockEntity);

            // Act
            await controller.delete(req as Request, res as Response, next);

            /**
             * Assert:
             * - The controller should call the service with the correct entity id
             * - The controller should return a 200 status code
             * - The controller should return the deleted entity in the response
             * - The controller should call the response utility with the correct arguments
             * - The controller should not call the next middleware
             */
            expect(service.delete).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(createResponseSpy).toHaveBeenCalledWith(
                'success',
                'TestEntity deleted successfully',
                mockEntity
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('handles deletion errors appropriately', async () => {
            // Arrange
            const errorScenarios = [
                new StatusError(0, 'Generic Error'),
                new Error('Unknown error')
            ];

            for (const error of errorScenarios) {
                // Reset mock for each scenario
                jest.clearAllMocks();
                (service.delete as jest.Mock).mockRejectedValueOnce(error);

                // Act
                await controller.delete(req as Request, res as Response, next);

                /**
                 * Assert:
                 * - The controller should call the service with the correct entity id
                 * - The controller should not call the response utility
                 * - The controller should not call the response.status or response.json methods here
                 * - The controller should call the next middleware with the error
                 *   Note: The error handler middleware will handle the response status and message
                 */
                expect(service.delete).toHaveBeenCalledWith(1);
                expect(responseUtil.createResponse).not.toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
                expect(res.json).not.toHaveBeenCalled();
                expect(next).toHaveBeenCalledWith(error);
            }
        });
    });

    describe('GetAll', () => {
        it('successfully retrieves all entities', async () => {
            // Arrange
            const mockEntities = [mockEntity];
            (service.getAll as jest.Mock).mockResolvedValue(mockEntities);

            // Act
            await controller.getAll(req as Request, res as Response, next);

            /**
             * Assert:
             * - The controller should call the service to retrieve all entities
             * - The controller should return a 200 status code
             * - The controller should return the retrieved entities in the response
             * - The controller should call the response utility with the correct arguments
             * - The controller should not call the next middleware
             */
            expect(service.getAll).toHaveBeenCalledWith();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(createResponseSpy).toHaveBeenCalledWith(
                'success',
                'TestEntity retrieved successfully',
                mockEntities
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('handles retrieval errors appropriately', async () => {
            // Arrange
            const errorScenarios = [
                new StatusError(0, 'Generic Error'),
                new Error('Unknown error')
            ];

            for (const error of errorScenarios) {
                // Reset mock for each scenario
                jest.clearAllMocks();
                (service.getAll as jest.Mock).mockRejectedValueOnce(error);

                // Act
                await controller.getAll(req as Request, res as Response, next);

                /**
                 * Assert:
                 * - The controller should call the service to retrieve all entities
                 * - The controller should not call the response utility
                 * - The controller should not call the response.status or response.json methods here
                 * - The controller should call the next middleware with the error
                 *   Note: The error handler middleware will handle the response status and message
                 */
                expect(service.getAll).toHaveBeenCalledWith();
                expect(responseUtil.createResponse).not.toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
                expect(res.json).not.toHaveBeenCalled();
                expect(next).toHaveBeenCalledWith(error);
            }
        });
    });

    describe('GetById', () => {
        it('successfully retrieves an entity by id', async () => {
            // Arrange
            (service.getById as jest.Mock).mockResolvedValue(mockEntity);

            // Act
            await controller.getById(req as Request, res as Response, next);

            /**
             * Assert:
             * - The controller should call the service with the correct entity id
             * - The controller should return a 200 status code
             * - The controller should return the retrieved entity in the response
             * - The controller should call the response utility with the correct arguments
             * - The controller should not call the next middleware
             */
            expect(service.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(createResponseSpy).toHaveBeenCalledWith(
                'success',
                'TestEntity retrieved successfully',
                mockEntity
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('handles retrieval by id errors appropriately', async () => {
            // Arrange
            const errorScenarios = [
                new StatusError(0, 'Generic Error'),
                new Error('Unknown error')
            ];

            for (const error of errorScenarios) {
                // Reset mock for each scenario
                jest.clearAllMocks();
                (service.getById as jest.Mock).mockRejectedValueOnce(error);

                // Act
                await controller.getById(req as Request, res as Response, next);

                /**
                 * Assert:
                 * - The controller should call the service with the correct entity id
                 * - The controller should not call the response utility
                 * - The controller should not call the response.status or response.json methods here
                 * - The controller should call the next middleware with the error
                 *   Note: The error handler middleware will handle the response status and message
                 */
                expect(service.getById).toHaveBeenCalledWith(1);
                expect(responseUtil.createResponse).not.toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
                expect(res.json).not.toHaveBeenCalled();
                expect(next).toHaveBeenCalledWith(error);
            }
        });
    });
});