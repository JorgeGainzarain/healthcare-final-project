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
}