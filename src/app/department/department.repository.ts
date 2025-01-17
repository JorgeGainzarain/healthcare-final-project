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
}