import 'reflect-metadata';
import { Container } from 'typedi';
import { DBQuery } from './models/db-query';
import { DBQueryResult } from './models/db-query-result';
import fs from 'fs';
import path from 'path';
import { config } from '../config/environment';

// Mock implementations
jest.mock('sqlite', () => {
  const originalModule = jest.requireActual('sqlite');
  return {
    __esModule: true,
    ...originalModule,
    open: jest.fn(),
  };
});

jest.mock('sqlite3', () => {
  const mockDatabaseClass = jest.fn().mockImplementation(function (this: any) {
    // You can define mock methods or leave it empty if you like.
  });

  return {
    __esModule: true,
    default: {
      Database: mockDatabaseClass
    }
  };
});

import { DatabaseService } from './database.service';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import {EntityConfig} from "../app/base/base.model";

describe('DatabaseService', () => {

  let databaseService: DatabaseService;

  // We'll define mocks for the open function and Database object methods.
  let dbMock: jest.Mocked<Database<sqlite3.Database, sqlite3.Statement>>;
  let openMock: jest.MockedFunction<typeof open>;

  beforeAll(() => {
    // Delete the database file before running the tests
    const dbFilePath = path.join(__dirname, `../data/${config.dbOptions.database}`);
    if (fs.existsSync(dbFilePath)) {
      fs.unlinkSync(dbFilePath);
    }
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    Container.reset();

    // Create a mock database object
    dbMock = {
      all: jest.fn().mockResolvedValue([]),
      exec: jest.fn(),
      close: jest.fn(),
      // Other Database methods you might need can be mocked here
    } as unknown as jest.Mocked<Database<sqlite3.Database, sqlite3.Statement>>;

    // Mock the open function to return our mock db
    openMock = open as jest.MockedFunction<typeof open>;
    openMock.mockResolvedValue(dbMock);

    databaseService = Container.get(DatabaseService);
  });

  describe('openDatabase', () => {
    it('should open the database if not already opened', async () => {
      await databaseService.openDatabase();
      expect(openMock).toHaveBeenCalledTimes(1);
      expect(dbMock.exec).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    });

    it('should not reopen the database if already opened', async () => {
      await databaseService.openDatabase();
      await databaseService.openDatabase();
      // open should be called only once
      expect(openMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('closeDatabase', () => {
    it('should close the database if opened', async () => {
      await databaseService.openDatabase();
      await databaseService.closeDatabase();
      expect(dbMock.close).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if database not opened', async () => {
      await databaseService.closeDatabase();
      expect(dbMock.close).not.toHaveBeenCalled();
    });
  });

  describe('execQuery', () => {
    it('should execute a query and return rows and rowCount', async () => {
      const mockRows = [{ id: 1, name: 'Test' }, { id: 2, name: 'Another' }];
      dbMock.all.mockResolvedValueOnce(mockRows);

      const query: DBQuery = {
        sql: 'SELECT * FROM test_table',
        params: []
      };

      const result: DBQueryResult = await databaseService.execQuery(query);

      expect(dbMock.all).toHaveBeenCalledWith('SELECT * FROM test_table', []);
      expect(result.rows).toEqual(mockRows);
      expect(result.rowCount).toEqual(2);
    });

    it('should close the database after query execution', async () => {
      dbMock.all.mockResolvedValueOnce([]);

      const query: DBQuery = {
        sql: 'SELECT * FROM test_table',
        params: []
      };

      await databaseService.execQuery(query);
      expect(dbMock.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('initializeDatabase', () => {
    it('should create necessary tables and close the database', async () => {
      await databaseService.initializeDatabase();

      // Check calls to exec (tables creation)

      for (const entity of Object.values(config.entityValues) as EntityConfig<any>[]) {
        const table = entity.table_name;
        if (table === '') continue;
        expect(dbMock.exec).toHaveBeenCalledWith(expect.stringContaining(`CREATE TABLE IF NOT EXISTS ${table}`));
      }
      expect(dbMock.close).toHaveBeenCalledTimes(1);
    });
  });
});