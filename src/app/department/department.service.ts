import {ActionType, BaseService} from "../base/base.service";
import {Department} from "./department.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {DepartmentRepository} from "./department.repository";
import {LogService} from "../log/log.service";
import {Service} from "typedi";
import {UserType} from "../user/user.model";
import {StatusError} from "../../utils/status_error";

@Service()
export class DepartmentService extends  BaseService<Department> {
    protected entityConfig: EntityConfig<Department> = config.entityValues.department;

    constructor(
        protected departmentRepository: DepartmentRepository,
        protected logService: LogService
    ) {
        super(departmentRepository, logService);
    }

    async before(action: ActionType, args: any): Promise<any> {
        const session = args[0];
        if (!session) {
            throw new StatusError(401, 'Unauthorized');
        }
        const role = session.role;
        if (action == ActionType.CREATE) {
            if (role !== UserType.ADMIN) {
                throw new StatusError(403, 'Only admins can create departments');
            }
        }
        if (action == ActionType.UPDATE) {
            if (role !== UserType.ADMIN) {
                throw new StatusError(403, 'Only admins can update departments');
            }
        }
        if (action == ActionType.DELETE) {
            if (role !== UserType.ADMIN) {
                throw new StatusError(403, 'Only admins can delete departments');
            }
        }
    }

}