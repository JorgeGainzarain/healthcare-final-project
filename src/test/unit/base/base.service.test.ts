import { BaseService } from '../../../app/base/base.service';
import { BaseRepository } from '../../../app/base/base.repository';
import { LogService } from '../../../app/log/log.service';
import { BaseModel, EntityConfig } from '../../../app/base/base.model';
import { StatusError } from '../../../utils/status_error';
import { Session } from 'express-session';

jest.mock('../../../app/base/base.repository');
jest.mock('../../../app/log/log.service');

interface TestEntity extends BaseModel {
  name: string;
}

class TestService extends BaseService<TestEntity> {
  protected entityConfig: EntityConfig<TestEntity> = {
    table_name: 'test_entities',
    unit: 'TestEntity',
    requiredFields: [{ name: 'name', type: 'string' }]
  };
}

describe('BaseService', () => {
  let repository: jest.Mocked<BaseRepository<TestEntity>>;
  let logService: jest.Mocked<LogService>;
  let service: TestService;
  let session: Partial<Session>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      existsById: jest.fn(),
      findByFields: jest.fn(),
      exists: jest.fn()
    } as unknown as jest.Mocked<BaseRepository<TestEntity>>;
    logService = {
        createLog: jest.fn()
    } as unknown as jest.Mocked<LogService>;
    service = new TestService(repository, logService);
    session = { userId: 1 } as Partial<Session>;
  });

  it('should create an entity', async () => {
    const entity = { id: 1, name: 'Test' };
    repository.create.mockResolvedValue(entity);

    const result = await service.create(session as Session, { name: 'Test' });

    expect(repository.create).toHaveBeenCalledWith({ name: 'Test' });
    expect(logService.createLog).toHaveBeenCalled();
    expect(result).toEqual(entity);
  });

  it('should update an entity', async () => {
    const entity = { id: 1, name: 'Updated Test' };
    repository.update.mockResolvedValue(entity);

    const result = await service.update(session as Session, 1, { name: 'Updated Test' });

    expect(repository.update).toHaveBeenCalledWith(1, { name: 'Updated Test' });
    expect(logService.createLog).toHaveBeenCalled();
    expect(result).toEqual(entity);
  });

  it('should delete an entity', async () => {
    const entity = { id: 1, name: 'Test' };
    repository.delete.mockResolvedValue(entity);

    const result = await service.delete(session as Session, 1);

    expect(repository.delete).toHaveBeenCalledWith(1);
    expect(logService.createLog).toHaveBeenCalled();
    expect(result).toEqual(entity);
  });

  it('should retrieve an entity by id', async () => {
    const entity = { id: 1, name: 'Test' };
    repository.findById.mockResolvedValue(entity);

    const result = await service.findById(session as Session, 1);

    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(logService.createLog).toHaveBeenCalled();
    expect(result).toEqual(entity);
  });

  it('should retrieve all entities', async () => {
    const entities = [{ id: 1, name: 'Test' }];
    repository.findAll.mockResolvedValue(entities);

    const result = await service.findAll(session as Session);

    expect(repository.findAll).toHaveBeenCalled();
    expect(logService.createLog).toHaveBeenCalled();
    expect(result).toEqual(entities);
  });

  it('should handle errors in create', async () => {
    const error = new StatusError(400, 'Create error');
    repository.create.mockRejectedValue(error);

    await expect(service.create(session as Session, { name: 'Test' })).rejects.toThrow(error);
  });

  it('should handle errors in update', async () => {
    const error = new StatusError(400, 'Update error');
    repository.update.mockRejectedValue(error);

    await expect(service.update(session as Session, 1, { name: 'Updated Test' })).rejects.toThrow(error);
  });

  it('should handle errors in delete', async () => {
    const error = new StatusError(400, 'Delete error');
    repository.delete.mockRejectedValue(error);

    await expect(service.delete(session as Session, 1)).rejects.toThrow(error);
  });

  it('should handle errors in findById', async () => {
    const error = new StatusError(400, 'FindById error');
    repository.findById.mockRejectedValue(error);

    await expect(service.findById(session as Session, 1)).rejects.toThrow(error);
  });

  it('should handle errors in findAll', async () => {
    const error = new StatusError(400, 'FindAll error');
    repository.findAll.mockRejectedValue(error);

    await expect(service.findAll(session as Session)).rejects.toThrow(error);
  });
});