import {BaseService} from "../base/base.service";
import {Department} from "./department.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {DepartmentRepository} from "./department.repository";
import {AuditService} from "../audit/audit.service";
import {Service} from "typedi";

@Service()
export class DepartmentService extends  BaseService<Department> {
    protected entityConfig: EntityConfig<Department> = config.entityValues.department;

    constructor(
        protected auditService: AuditService,
        protected departmentRepository: DepartmentRepository
    ) {
        super(auditService, departmentRepository);
    }

}