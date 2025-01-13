import {DatabaseService} from '../../database/database.service';
import {StatusError} from '../../utils/status_error';
import {EntityConfig} from "./base.model";

export abstract class BaseRepository<T extends Object> {
    protected abstract entityConfig: EntityConfig<T>;

    protected constructor(
        protected readonly databaseService: DatabaseService
    ) {}


    async create(entity: T ): Promise<T> {
        if (await this.exists(entity)) {
            throw new StatusError(409, `A ${this.entityConfig.unit} with the provided details already exists.`);
        }

        const columns = Object.keys(entity).join(', ');
        const placeholders = Object.keys(entity).map(() => '?').join(', ');
        const queryDoc = {
            sql: `INSERT INTO ${this.entityConfig.table_name} (${columns}) VALUES (${placeholders})`,
            params: Object.values(entity)
        };

        const result = await this.databaseService.execQuery(queryDoc);
        return result.rows[0];
    }

    async update(id: number, entity: Partial<T>): Promise<T> {
        if (!(await this.existsById(id))) {
            throw new StatusError(404, `${this.entityConfig.unit} with id "${id}" not found.`);
        }

        const columns = Object.keys(entity).map(key => `${key} = ?`).join(', ');
        const queryDoc = {
            sql: `UPDATE ${this.entityConfig.table_name} SET ${columns} WHERE id = ?`,
            params: [...Object.values(entity), id]
        };

        const result = await this.databaseService.execQuery(queryDoc);

        return result.rows[0];
    }

    async delete(id: number): Promise<T> {
        if (!await this.existsById(id)) {
            throw new StatusError(404, `${this.entityConfig.unit} with id "${id}" not found.`);
        }
        const queryDoc = {
            sql: `DELETE FROM ${this.entityConfig.table_name} WHERE id = ?`,
            params: [id]
        };
        const result = await this.databaseService.execQuery(queryDoc);

        return result.rows[0];
    }


    async findAll(): Promise<T[]> {
        const queryDoc = {
            sql: `SELECT * FROM ${this.entityConfig.table_name}`
        };
        const result = await this.databaseService.execQuery(queryDoc);
        return result.rows;
    }

    async findById(id: number): Promise<T> {
        const queryDoc = {
            sql: `SELECT * FROM ${this.entityConfig.table_name} WHERE id = ?`,
            params: [id]
        };
        const result = await this.databaseService.execQuery(queryDoc);
        return result.rows[0]?? null;
    }

    async existsById(id: number): Promise<boolean> {
        return (await this.findById(id) !== null);
    }
    async findByFields(fields: Partial<T>): Promise<T | undefined> {
        const columns = Object.keys(fields).map(key => `${key} = ?`).join(' AND ');
        const queryDoc = {
            sql: `SELECT * FROM ${this.entityConfig.table_name} WHERE ${columns}`,
            params: Object.values(fields)
        };
        const result = await this.databaseService.execQuery(queryDoc);

        return result.rows[0]?? undefined;
    }

    async exists(fields: Partial<T>): Promise<boolean> {
        return (await this.findByFields(fields) !== undefined);
    }
}