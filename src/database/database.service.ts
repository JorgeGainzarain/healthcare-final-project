import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { Service } from 'typedi';
import { config } from '../config/environment';
import path from 'path';
import { DBQuery } from './models/db-query';
import { DBQueryResult } from './models/db-query-result';
import { EntityConfig } from '../app/base/base.model';


// Define the base directory as the project root
const baseDir = process.cwd();

@Service()
export class DatabaseService {
  private db: Database | null = null;
  public databasePath: string = path.resolve(baseDir, `src/data/${config.dbOptions.database}`);
  //public databasePath: string = path.join(__dirname, `/data/${config.dbOptions.database}`);

  public async openDatabase(): Promise<Database> {
    if (this.db) {
      return this.db;
    }

    console.log(`Opening database at ${this.databasePath}`);

    this.db = await open({
      filename: this.databasePath,
      driver: sqlite3.Database
    });

    await this.db.exec(`PRAGMA foreign_keys = ON;`);

    return this.db;
  }

  public async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  public async execQuery(query: DBQuery): Promise<DBQueryResult> {
    const dbClient = await this.openDatabase();
    let { sql, params } = query;

    // If the query is an INSERT statement, add a RETURNING * clause to return the inserted row
    if (sql.startsWith('INSERT') || sql.startsWith('UPDATE') || sql.startsWith('DELETE')) {
      sql = sql + ' RETURNING *';
    }

    try {
      const rows: [] = await dbClient.all(sql, params);
      return { rows: rows, rowCount: rows.length };
    } finally {
      await this.closeDatabase();
    }
  }

  public async clearDatabase(): Promise<void> {
    await this.openDatabase();

    for (const table of Object.values(config.entityValues) as EntityConfig<any>[]) {
      const deleteTableSQL = `DELETE FROM ${table.table_name.toLowerCase().replace(' ', '_')}`;
      await this.db!.exec(deleteTableSQL);
    }

    await this.closeDatabase();
  }

  public async initializeDatabase(): Promise<void> {
    await this.openDatabase();

    for (const table of Object.values(config.entityValues) as EntityConfig<any>[]) {
      if (table.requiredFields.length === 0) {
        console.error(`Table ${table.table_name} has no required fields.`);
        process.exit(0);
      }

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${table.table_name.toLowerCase().replace(' ', '_')} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ${table.requiredFields.map(field => `${String(field.name)} ${field.type}`).join(', ')}
        )
      `;
      await this.db!.exec(createTableSQL);
    }

    await this.closeDatabase();
  }
}