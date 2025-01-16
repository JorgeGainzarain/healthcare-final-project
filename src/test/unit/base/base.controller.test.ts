import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../app/base/base.controller';
import { BaseService } from '../../../app/base/base.service';
import { BaseModel, EntityConfig } from '../../../app/base/base.model';
import { createResponse } from '../../../utils/response';
import {Session} from "express-session";
import {StatusError} from "../../../utils/status_error";

jest.mock('../../../app/base/base.service');

interface TestEntity extends BaseModel {
  name: string;
}

class TestController extends BaseController<TestEntity> {
  protected entityConfig: EntityConfig<TestEntity> = {
    table_name: 'test_entities',
    unit: 'TestEntity',
    requiredFields: [{ name: 'name', type: 'string' }]
  };
}

describe('BaseController', () => {
  let service: jest.Mocked<BaseService<TestEntity>>;
  let controller: TestController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const createMockRequest = () => ({
    session: { userId: 1, id: 'mockId' } as unknown as Session,
    body: {},
    params: { id: '1' }
  });

  const createMockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  });

  const createMockNextFunction = () => jest.fn();

  beforeEach(() => {
    service = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      logAction: jest.fn(),
    } as unknown as jest.Mocked<BaseService<TestEntity>>;
    controller = new TestController(service);
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNextFunction();
  });

  it('should create an entity', async () => {
    const entity = { id: 1, name: 'Test' };
    service.create.mockResolvedValue(entity);

    await controller.create(req as Request, res as Response, next);

    expect(service.create).toHaveBeenCalledWith(req.session, req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createResponse('success', 'TestEntity created successfully', entity));
  });

  it('should update an entity', async () => {
    const id = parseInt(req.params!.id, 10);
    if (isNaN(id)) {
      return next(new Error('Invalid ID'));
    }
    const entity = { id: 1, name: 'Updated Test' };
    service.update.mockResolvedValue(entity);

    await controller.update({ ...req, params: { id: req.params!.id } } as unknown as Request, res as Response, next);

    expect(service.update).toHaveBeenCalledWith(req.session, 1, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(createResponse('success', 'TestEntity updated successfully', entity));
  });

  it('should delete an entity', async () => {
    const id = parseInt(req.params!.id, 10);
    if (isNaN(id)) {
      return next(new Error('Invalid ID'));
    }
    const entity = { id: 1, name: 'Test' };
    service.delete.mockResolvedValue(entity);

    await controller.delete({ ...req, params: { id: req.params!.id } } as unknown as Request, res as Response, next);

    expect(service.delete).toHaveBeenCalledWith(req.session, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(createResponse('success', 'TestEntity deleted successfully', entity));
  });

  it('should retrieve all entities', async () => {
    const entities = [{ id: 1, name: 'Test' }];
    service.findAll.mockResolvedValue(entities);

    await controller.getAll(req as Request, res as Response, next);

    expect(service.findAll).toHaveBeenCalledWith(req.session);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(createResponse('success', 'TestEntity retrieved successfully', entities));
  });

  it('should retrieve an entity by id', async () => {
    const id = parseInt(req.params!.id, 10);
    if (isNaN(id)) {
      return next(new Error('Invalid ID'));
    }
    const entity = { id: 1, name: 'Test' };
    service.findById.mockResolvedValue(entity);

    await controller.getById({ ...req, params: { id: req.params!.id } } as unknown as Request, res as Response, next);

    expect(service.findById).toHaveBeenCalledWith(req.session, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(createResponse('success', 'TestEntity retrieved successfully', entity));
  });

  it('should handle errors in create', async () => {
    const error = new StatusError(400, 'Create error');
    service.create.mockRejectedValue(error);

    await controller.create(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should handle errors in update', async () => {
    const error = new StatusError(400, 'Update error');
    service.update.mockRejectedValue(error);

    await controller.update(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should handle errors in delete', async () => {
    const error = new StatusError(400, 'Delete error');
    service.delete.mockRejectedValue(error);

    await controller.delete(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should handle errors in getAll', async () => {
    const error = new StatusError(400, 'GetAll error');
    service.findAll.mockRejectedValue(error);

    await controller.getAll(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should handle errors in getById', async () => {
    const error = new StatusError(400, 'GetById error');
    service.findById.mockRejectedValue(error);

    await controller.getById(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});