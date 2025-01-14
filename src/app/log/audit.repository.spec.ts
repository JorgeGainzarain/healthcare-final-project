import 'reflect-metadata';
import { Container } from 'typedi';
import { LogRepository } from './log.repository';
import { DatabaseService } from '../../database/database.service';
import { Audit } from './audit.model';
import { DBQueryResult } from '../../database/models/db-query-result';

describe('AuditRepository', () => {
  let auditRepository: LogRepository;
  let databaseServiceMock: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    // Create a mock DatabaseService
    databaseServiceMock = {
      execQuery: jest.fn()
    } as unknown as jest.Mocked<DatabaseService>;

    // Set the mock in the container
    Container.set(DatabaseService, databaseServiceMock);

    // Get instance of AuditRepository from container
    auditRepository = Container.get(LogRepository);
  });

  describe('create', () => {
    it('should insert an audit and return the created audit', async () => {
      const auditToCreate: Audit = { message: 'Test message' };

      const mockResult: DBQueryResult = {
        rows: [{ id: 1, message: 'Test message' }],
        rowCount: 1
      };

      databaseServiceMock.execQuery.mockResolvedValueOnce(mockResult);

      const created = await auditRepository.create(auditToCreate);
      expect(databaseServiceMock.execQuery).toHaveBeenCalledWith({
        sql: 'INSERT INTO audits (message) VALUES (?)',
        params: ['Test message']
      });
      expect(created).toEqual({ id: 1, message: 'Test message' });
    });
  });

  describe('findAll', () => {
    it('should return all audits', async () => {
      const mockRows = [
        { id: 1, message: 'Audit 1' },
        { id: 2, message: 'Audit 2' }
      ];

      const mockResult: DBQueryResult = {
        rows: mockRows,
        rowCount: 2
      };

      databaseServiceMock.execQuery.mockResolvedValueOnce(mockResult);

      const audits = await auditRepository.findAll();

      expect(databaseServiceMock.execQuery).toHaveBeenCalledWith({
        sql: 'SELECT * FROM audits'
      });
      expect(audits).toEqual(mockRows);
    });

    it('should return an empty array if no audits found', async () => {
      const mockResult: DBQueryResult = {
        rows: [],
        rowCount: 0
      };

      databaseServiceMock.execQuery.mockResolvedValueOnce(mockResult);

      const audits = await auditRepository.findAll();

      expect(databaseServiceMock.execQuery).toHaveBeenCalledWith({
        sql: 'SELECT * FROM audits'
      });
      expect(audits).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return the audit if found', async () => {
      const mockAudit = { id: 1, message: 'Found audit' };

      const mockResult: DBQueryResult = {
        rows: [mockAudit],
        rowCount: 1
      };

      databaseServiceMock.execQuery.mockResolvedValueOnce(mockResult);

      const audit = await auditRepository.findById(1);

      expect(databaseServiceMock.execQuery).toHaveBeenCalledWith({
        sql: 'SELECT * FROM audits WHERE id = ?',
        params: [1]
      });
      expect(audit).toEqual(mockAudit);
    });

    it('should return null if audit not found', async () => {
      const mockResult: DBQueryResult = {
        rows: [],
        rowCount: 0
      };

      databaseServiceMock.execQuery.mockResolvedValueOnce(mockResult);

      const audit = await auditRepository.findById(99);

      expect(databaseServiceMock.execQuery).toHaveBeenCalledWith({
        sql: 'SELECT * FROM audits WHERE id = ?',
        params: [99]
      });
      expect(audit).toBeNull();
    });
  });
});
