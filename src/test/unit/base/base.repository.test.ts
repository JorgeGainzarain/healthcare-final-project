import { BaseRepository } from '../../../app/base/base.repository';
import { DatabaseService } from '../../../database/database.service';
import { StatusError } from '../../../utils/status_error';
import { BaseModel, EntityConfig } from '../../../app/base/base.model';
import {DBQueryResult} from "../../../database/models/db-query-result";
import {config} from "../../../config/environment";

jest.mock('../../../database/database.service');

interface TestEntity extends BaseModel {
  name: string;
}

class TestRepository extends BaseRepository<TestEntity> {
  protected entityConfig: EntityConfig<TestEntity> = config.entityValues.test;

}

describe('BaseRepository', () => {
  let databaseService: jest.Mocked<DatabaseService>;
  let repository: TestRepository;

  beforeEach(() => {
    databaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    databaseService.initializeDatabase();
    databaseService.clearDatabase();
    repository = new TestRepository(databaseService);
  });

  it('should create an entity', async () => {
    const entity = { id: 1, name: 'Test' };

    databaseService.execQuery
        .mockResolvedValueOnce({ rows: [undefined] } as DBQueryResult)
        .mockResolvedValueOnce({ rows: [entity] } as DBQueryResult);

    const result = await repository.create(entity);

    expect(databaseService.execQuery).toHaveBeenCalledWith({
      sql: 'INSERT INTO test_entities (id, name) VALUES (?, ?)',
      params: [1, 'Test']
    });
    expect(result).toEqual(entity);
  });

  it('should update an entity', async () => {
    const entity = { id: 1, name: 'Updated Test' };
    databaseService.execQuery.mockResolvedValue({ rows: [entity] } as DBQueryResult);

    const result = await repository.update(1, { name: 'Updated Test' });

    expect(databaseService.execQuery).toHaveBeenCalledWith({
      sql: 'UPDATE test_entities SET name = ? WHERE id = ?',
      params: ['Updated Test', 1]
    });
    expect(result).toEqual(entity);
  });

  it('should delete an entity', async () => {
    const entity = { id: 1, name: 'Test' };
    databaseService.execQuery.mockResolvedValue({ rows: [entity] } as DBQueryResult);

    const result = await repository.delete(1);

    expect(databaseService.execQuery).toHaveBeenCalledWith({
      sql: 'DELETE FROM test_entities WHERE id = ?',
      params: [1]
    });
    expect(result).toEqual(entity);
  });

  it('should retrieve an entity by id', async () => {
    const entity = { id: 1, name: 'Test' };
    databaseService.execQuery.mockResolvedValue({ rows: [entity] } as DBQueryResult);

    const result = await repository.findById(1);

    expect(databaseService.execQuery).toHaveBeenCalledWith({
      sql: 'SELECT * FROM test_entities WHERE id = ?',
      params: [1]
    });
    expect(result).toEqual(entity);
  });

  it('should retrieve all entities', async () => {
    const entities = [{ id: 1, name: 'Test' }];
    databaseService.execQuery.mockResolvedValue({ rows: entities } as DBQueryResult);

    const result = await repository.findAll();

    expect(databaseService.execQuery).toHaveBeenCalledWith({
      sql: 'SELECT * FROM test_entities'
    });
    expect(result).toEqual(entities);
  });

  it('should handle errors in create', async () => {
    const error = new StatusError(409, 'Create error');
    databaseService.execQuery.mockRejectedValue(error);

    await expect(repository.create({ id: 1, name: 'Test' })).rejects.toThrow(error);
  });

  it('should handle errors in update', async () => {
    const error = new StatusError(404, 'Update error');
    databaseService.execQuery.mockRejectedValue(error);

    await expect(repository.update(1, { name: 'Updated Test' })).rejects.toThrow(error);
  });

  it('should handle errors in delete', async () => {
    const error = new StatusError(404, 'Delete error');
    databaseService.execQuery.mockRejectedValue(error);

    await expect(repository.delete(1)).rejects.toThrow(error);
  });

  it('should handle errors in findById', async () => {
    const error = new StatusError(404, 'FindById error');
    databaseService.execQuery.mockRejectedValue(error);

    await expect(repository.findById(1)).rejects.toThrow(error);
  });

  it('should handle errors in findAll', async () => {
    const error = new StatusError(400, 'FindAll error');
    databaseService.execQuery.mockRejectedValue(error);

    await expect(repository.findAll()).rejects.toThrow(error);
  });
});