import {ActionType, BaseService} from "../base/base.service";
import {Record} from "./record.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {RecordRepository} from "./record.repository";
import {LogService} from "../log/log.service";
import {Container, Service} from "typedi";
import {SessionContext} from "../../middleware/authentificate_JWT";

import { validateView } from './validations/validateView';
import { validateCreate } from './validations/validateCreate';
import { validateUpdate } from './validations/validateUpdate';
import {UserType} from "../user/user.model";
import {StatusError} from "../../utils/status_error";

@Service()
export class RecordService extends  BaseService<Record> {
    protected entityConfig: EntityConfig<Record> = config.entityValues.record;

    constructor(
        protected recordRepository: RecordRepository,
        protected auditService: LogService
    ) {
        super(recordRepository, auditService);
    }

    async findAll(user_id: number): Promise<Record[]> {
        let records = await this.recordRepository.findAll();
        const role = Container.get(SessionContext).role;
        if (!role) {
            throw new StatusError(403, 'You must be logged in to perform this action');
        }
        if (role !== UserType.ADMIN) {
            records = records.filter(record => {
                if (role === UserType.DOCTOR) {
                    return record.doctor_id === Container.get(SessionContext).doctorId;
                }
                if (role === UserType.PATIENT) {
                    return record.patient_id === Container.get(SessionContext).patientId;
                }
            });
        }
        await this.logAction(user_id, records, 'retrieved');
        return records;
    }

    async before(action: ActionType, args: any[]) {
        const role = Container.get(SessionContext).role;
        if (!role) {
            throw new StatusError(403, 'You must be logged in to perform this action');
        }
        // Admins have full access
        if (role === UserType.ADMIN) {
            return;
        }
        switch (action) {
            case ActionType.VIEW :
                await validateView(role, args);
                break;
            case ActionType.CREATE:
                await validateCreate(role, args);
                break;
            case ActionType.UPDATE:
                await validateUpdate(role, args);
                break;
        }
    }

}