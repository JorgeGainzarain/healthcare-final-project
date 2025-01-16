import {DatabaseService} from '../../database/database.service';
import {StatusError} from '../../utils/status_error';
import {EntityConfig} from "./base.model";
import {BaseModel} from "./base.model";
import {Service} from "typedi";
import {Patient} from "../patient/patient.model";

@Service()
export abstract class BaseRepository<T extends BaseModel> {
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

    // Helper functions for parsing and stringify JSON and array fields
    protected stringifyFields(patient: Partial<Patient>): void {
        if (!patient) return;
        // iterate over the Patient fields and stringify the JSON or [] fields
        Object.keys(patient).forEach((key: string) => {
            if (this.entityConfig.requiredFields.find((field) => field.name === key)) {
                const fieldKey = key as keyof Partial<Patient>;
                if (typeof patient[fieldKey] === 'object' && patient[fieldKey] !== undefined) {
                    patient[fieldKey] = JSON.stringify(patient[fieldKey]) as any;
                }
            }
        });
    }

    protected parseFields(patient: Partial<Patient>): void {
        if (!patient) return;
        // iterate over the Patient fields and parse the JSON or [] fields
        Object.keys(patient).forEach((key: string) => {
            let field = this.entityConfig.requiredFields.find((field) => field.name === key)
            if (field && (field.type.endsWith('[]') || field.type === 'JSON')) {
                const fieldKey = key as keyof Partial<Patient>;
                if (typeof patient[fieldKey] === 'string') {
                    patient[fieldKey] = JSON.parse(patient[fieldKey]) as any;
                }
            }
        });
    }
}