import 'reflect-metadata';
import { Container } from 'typedi';
import { LogService } from './log.service';
import { LogRepository } from './log.repository';
import { Audit } from './audit.model';

describe('AuditService', () => {
  let auditService: LogService;
  let auditRepositoryMock: jest.Mocked<LogRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    // Create a mock AuditRepository
    auditRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<LogRepository>;

    // Register the mock in the container
    Container.set(LogRepository, auditRepositoryMock);

    // Get an instance of AuditService from the container
    auditService = Container.get(LogService);
  });

  describe('create', () => {
    it('should create an audit if input is valid', async () => {
      const auditMessage = 'A valid audit message';
      const createdAudit: Audit = { id: '1', message: auditMessage };

      auditRepositoryMock.create.mockResolvedValueOnce(createdAudit);

      const result = await auditService.create(auditMessage);

      expect(auditRepositoryMock.create).toHaveBeenCalledWith({ message: auditMessage });
      expect(result).toEqual(createdAudit);
    });

    it('should reject if audit input is invalid', async () => {
      await expect(auditService.create(null as unknown as string))
        .rejects
        .toThrow('AuditInputValidationError');

      await expect(auditService.create('')) // empty string also invalid as message cannot be null but empty string is considered valid string?
        .resolves.not.toThrow();

      // If you consider empty string as invalid (depending on your definition), test that here:
      // For the sake of completeness, let's say empty string is allowed since it's still a string.
      // If you want to make empty strings invalid, you'd need to add that logic in the service.
    });
  });

  describe('findAll', () => {
    it('should return all audits', async () => {
      const audits: Audit[] = [
        { id: '1', message: 'Audit 1' },
        { id: '2', message: 'Audit 2' }
      ];

      auditRepositoryMock.findAll.mockResolvedValueOnce(audits);

      const result = await auditService.findAll();

      expect(auditRepositoryMock.findAll).toHaveBeenCalled();
      expect(result).toEqual(audits);
    });

    it('should return empty array if no audits are found', async () => {
      auditRepositoryMock.findAll.mockResolvedValueOnce([]);

      const result = await auditService.findAll();

      expect(auditRepositoryMock.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return the audit if valid id and audit found', async () => {
      const audit: Audit = { id: '1', message: 'Found audit' };
      auditRepositoryMock.findById.mockResolvedValueOnce(audit);

      const result = await auditService.findById(1);

      expect(auditRepositoryMock.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(audit);
    });

    it('should return null if valid id but audit not found', async () => {
      // @ts-ignore
      auditRepositoryMock.findById.mockResolvedValueOnce(null);

      const result = await auditService.findById(999);

      expect(auditRepositoryMock.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should reject if invalid id is provided', async () => {
      await expect(auditService.findById(0))
        .rejects
        .toThrow('InvalidAuditIdError');

      await expect(auditService.findById(-1))
        .rejects
        .toThrow('InvalidAuditIdError');

      await expect(auditService.findById(null as unknown as number))
        .rejects
        .toThrow('InvalidAuditIdError');

      await expect(auditService.findById(NaN))
        .rejects
        .toThrow('InvalidAuditIdError');

    });
  });
});
