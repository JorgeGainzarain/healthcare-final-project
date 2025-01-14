import {BaseRepository} from "../base/base.repository";
import {Department} from "./department.model";
import {EntityConfig} from "../base/base.model";
import {config } from "../../config/environment"
import {DatabaseService} from "../../database/database.service";
import {Service} from "typedi";

@Service()
export class DepartmentRepository extends BaseRepository<Department> {
    protected entityConfig: EntityConfig<Department> = config.entityValues.department;

    constructor(
        protected databaseService: DatabaseService
    ) {
        super(databaseService);
    }

    // Overrides
    async create(data: Department): Promise<Department> {
        this.stringifyFields(data);
        const department = await super.create(data);
        this.parseFields(department);
        return department;
    }

    async update(id: number, data: Partial<Department>): Promise<Department> {
        this.stringifyFields(data);
        const department = await super.update(id, data);
        this.parseFields(department);
        return department;
    }

    async findById(id: number): Promise<Department> {
        const department = await super.findById(id);
        this.parseFields(department);
        return department;
    }

    async findAll(): Promise<Department[]> {
        const departments = await super.findAll();
        departments.forEach(department => this.parseFields(department));
        return departments;
    }

    async delete(id: number): Promise<Department> {
        const department = await super.delete(id);
        this.parseFields(department);
        return department;
    }

    // Helper functions for parsing and stringify JSON and array fields
    protected stringifyFields(department: Partial<Department>): void {
        // iterate over the department_Private fields and stringify the JSON or [] fields
        Object.keys(department).forEach((key: string) => {
            if (this.entityConfig.requiredFields.find((field) => field.name === key)) {
                const fieldKey = key as keyof Partial<Department>;
                if (typeof department[fieldKey] === 'object' && department[fieldKey] !== undefined) {
                    department[fieldKey] = JSON.stringify(department[fieldKey]) as any;
                }
            }
        });
    }

    protected parseFields(department: Partial<Department>): void {
        // iterate over the department_Private fields and parse the JSON or [] fields
        Object.keys(department).forEach((key: string) => {
            let field = this.entityConfig.requiredFields.find((field) => field.name === key)
            if (field && (field.type.endsWith('[]') || field.type === 'JSON')) {
                const fieldKey = key as keyof Partial<Department>;
                if (typeof department[fieldKey] === 'string') {
                    department[fieldKey] = JSON.parse(department[fieldKey]) as any;
                }
            }
        });
    }
}