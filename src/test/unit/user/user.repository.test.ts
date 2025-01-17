import {UserRepository} from "../../../app/user/user.repository";
import {UserType} from "../../../app/user/user.model";
import {config} from "../../../config/environment";
import {DatabaseService} from "../../../database/database.service";

describe('UserRepository', () => {

    // Repository successfully finds user by username
    it('should find user when searching by valid username', async () => {
      const mockUser = { id: 1, username: 'testUser', password: 'pass', role: UserType.ADMIN };
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [mockUser] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: 'testUser' });

      expect(result).toEqual(mockUser);
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: ['testUser']
      });
    });

    // Repository inherits and uses base CRUD operations from BaseRepository
    it('should inherit CRUD methods from BaseRepository', async () => {
      const repository = new UserRepository({} as DatabaseService);
  
      expect(repository.create).toBeDefined();
      expect(repository.update).toBeDefined(); 
      expect(repository.delete).toBeDefined();
      expect(repository.findAll).toBeDefined();
      expect(repository.findById).toBeDefined();
    });

    // Repository correctly initializes with DatabaseService dependency
    it('should initialize with DatabaseService dependency', () => {
      const dbService = new DatabaseService();
      const repository = new UserRepository(dbService);

      expect(repository['databaseService']).toBe(dbService);
    });

    // Repository uses configured entity values from config
    it('should use configured entity values from config', () => {
      const repository = new UserRepository({} as DatabaseService);
  
      expect(repository['entityConfig']).toBe(config.entityValues.user);
    });

    // Repository returns undefined when no user found with username
    it('should return undefined when username not found', async () => {
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: 'nonexistent' });

      expect(result).toBeUndefined();
    });

    // Handle SQL injection attempts in username field
    it('should safely handle SQL injection attempts in username', async () => {
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [] }) };
      const repository = new UserRepository(mockDbService as any);
      const maliciousUsername = "admin' OR '1'='1";

      await repository.findByFields({ username: maliciousUsername });

      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: [maliciousUsername]
      });
    });

    // Handle empty string username search
    it('should handle empty string username search', async () => {
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: '' });

      expect(result).toBeUndefined();
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: ['']
      });
    });

    // Handle case when database connection fails
    it('should handle database connection failure', async () => {
      const mockDbService = { execQuery: jest.fn().mockRejectedValue(new Error('DB Error')) };
      const repository = new UserRepository(mockDbService as any);

      await expect(repository.findByFields({ username: 'test' }))
        .rejects.toThrow('DB Error');
    });

    // Handle case when entityConfig is undefined or invalid
    it('should handle undefined entityConfig', async () => {
      const repository = new UserRepository({} as DatabaseService);
      repository['entityConfig'] = undefined;

      await expect(repository.findByFields({ username: 'test' }))
        .rejects.toThrow();
    });

    // Handle special characters in username
    it('should handle special characters in username', async () => {
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [] }) };
      const repository = new UserRepository(mockDbService as any);
      const usernameWithSpecialChars = 'test@user#$%^';

      await repository.findByFields({ username: usernameWithSpecialChars });

      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: [usernameWithSpecialChars]
      });
    });

    // Repository successfully finds user by username
    it('should return user when searching by existing username', async () => {
      const mockUser = { id: 1, username: 'existingUser', password: 'securePass', role: UserType.DOCTOR };
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [mockUser] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: 'existingUser' });

      expect(result).toEqual(mockUser);
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: ['existingUser']
      });
    });

    // Repository correctly initializes with DatabaseService dependency
    it('should initialize with DatabaseService dependency', () => {
      const mockDbService = { execQuery: jest.fn() };
      const repository = new UserRepository(mockDbService as any);

      expect(repository).toBeInstanceOf(UserRepository);
      expect(repository['databaseService']).toBe(mockDbService);
    });

    // Repository inherits and uses base CRUD operations from BaseRepository
    it('should create a new user when valid data is provided', async () => {
      const mockUser = { username: 'newUser', password: 'newPass', role: UserType.DOCTOR };
      const mockDbService = { execQuery: jest.fn().mockResolvedValueOnce({rows: []})
              .mockResolvedValue({ rows: [{ ...mockUser, id: 1 }] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.create(mockUser);

      expect(result).toEqual({ ...mockUser, id: 1 });
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('INSERT INTO users (username, password, role) VALUES (?, ?, ?)'),
        params: ['newUser', 'newPass', UserType.DOCTOR]
      });
    });

    // Repository returns undefined when no user found with username
    it('should return undefined when no user is found with the given username', async () => {
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: 'nonExistentUser' });

      expect(result).toBeUndefined();
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: ['nonExistentUser']
      });
    });

    // Repository uses configured entity values from config
    it('should use configured entity values from config when executing query', async () => {
      const mockUser = { id: 1, username: 'testUser', password: 'pass', role: UserType.ADMIN };
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [mockUser] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: 'testUser' });

      expect(result).toEqual(mockUser);
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: `SELECT * FROM ${config.entityValues.user.table_name} WHERE username = ?`,
        params: ['testUser']
      });
    });

    // Handle SQL injection attempts in username field
    it('should prevent SQL injection when username contains malicious input', async () => {
      const maliciousUsername = "'; DROP TABLE users; --";
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: maliciousUsername });

      expect(result).toBeUndefined();
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: [maliciousUsername]
      });
      expect(mockDbService.execQuery).not.toHaveBeenCalledWith({
        sql: expect.stringContaining('DROP TABLE users'),
        params: []
      });
    });

    // Handle empty string username search
    it('should return undefined when searching with an empty string username', async () => {
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: '' });

      expect(result).toBeUndefined();
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: ['']
      });
    });

    // Handle case when entityConfig is undefined or invalid
    it('should throw error when entityConfig is undefined', async () => {
      const mockDbService = { execQuery: jest.fn() };
      const repository = new UserRepository(mockDbService as any);
      repository.entityConfig = undefined;

      await expect(repository.findByFields({ username: 'testUser' })).rejects.toThrowError();
      expect(mockDbService.execQuery).not.toHaveBeenCalled();
    });

    // Handle case when database connection fails
    it('should throw an error when database connection fails', async () => {
      const mockDbService = { execQuery: jest.fn().mockRejectedValue(new Error('Database connection failed')) };
      const repository = new UserRepository(mockDbService as any);

      await expect(repository.findByFields({ username: 'testUser' })).rejects.toThrow('Database connection failed');
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: ['testUser']
      });
    });

    // Handle special characters in username
    it('should handle special characters in username when searching', async () => {
      const specialCharUsername = 'user!@#';
      const mockUser = { id: 1, username: specialCharUsername, password: 'pass', role: UserType.ADMIN };
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [mockUser] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: specialCharUsername });

      expect(result).toEqual(mockUser);
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: [specialCharUsername]
      });
    });

    // Repository overrides only findByFields method while keeping other base methods
    it('should use custom query when findByFields is called with username', async () => {
      const mockUser = { id: 1, username: 'testUser', password: 'pass', role: UserType.ADMIN };
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [mockUser] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: 'testUser' });

      expect(result).toEqual(mockUser);
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: ['testUser']
      });
    });

    // Repository uses correct table name from entity config
    it('should use correct table name from entity config when executing query', async () => {
      const mockUser = { id: 1, username: 'testUser', password: 'pass', role: UserType.ADMIN };
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [mockUser] }) };
      const repository = new UserRepository(mockDbService as any);
  
      await repository.findByFields({ username: 'testUser' });
  
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining(`SELECT * FROM ${config.entityValues.user.table_name} WHERE username = ?`),
        params: ['testUser']
      });
    });

    // Custom findByFields ignores other fields besides username
    it('should ignore non-username fields when searching', async () => {
      const mockUser = { id: 1, username: 'testUser', password: 'pass', role: UserType.ADMIN };
      const mockDbService = { execQuery: jest.fn().mockResolvedValue({ rows: [mockUser] }) };
      const repository = new UserRepository(mockDbService as any);

      const result = await repository.findByFields({ username: 'testUser', role: UserType.DOCTOR });

      expect(result).toEqual(mockUser);
      expect(mockDbService.execQuery).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        params: ['testUser']
      });
    });
});
