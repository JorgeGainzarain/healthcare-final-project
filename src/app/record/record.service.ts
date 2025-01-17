import {ActionType, BaseService} from "../base/base.service";
import {Record} from "./record.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {RecordRepository} from "./record.repository";
import {LogService} from "../log/log.service";
import {Service} from "typedi";
import {Session, SessionData } from "express-session";

import { validateView } from './validations/validateView';
import { validateCreate } from './validations/validateCreate';
import { validateUpdate } from './validations/validateUpdate';
import {UserType} from "../user/user.model";
import {StatusError} from "../../utils/status_error";
import {NotificationService} from "../notification/notification.service";
import {PatientRepository} from "../patient/patient.repository";
import {DoctorRepository} from "../doctor/doctor.repository";

@Service()
export class RecordService extends  BaseService<Record> {
    protected entityConfig: EntityConfig<Record> = config.entityValues.record;

    constructor(
        protected recordRepository: RecordRepository,
        protected logService: LogService,

        protected notificationService: NotificationService,
        protected patientRepository: PatientRepository,
        protected doctorRepository: DoctorRepository
    ) {
        super(recordRepository, logService);
        this.notificationService= notificationService;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    async findAll(session: Session & Partial<SessionData>): Promise<Record[]> {
        await this.before(ActionType.VIEW_ALL, [session]);
        const user_id = session.userId;
        let records = await this.recordRepository.findAll();
        const role = session.role;
        if (role !== UserType.ADMIN) {
            records = records.filter(record => {
                if (role === UserType.DOCTOR) {
                    return record.doctor_id === session.doctorId;
                }
                if (role === UserType.PATIENT) {
                    return record.patient_id === session.patientId;
                }
            });
        }
        await this.after(ActionType.VIEW_ALL, records, [session]);
        await this.logAction(user_id!, records, 'retrieved');
        return records;
    }

    async before(action: ActionType, args: any[]) {
        const session = args[0] as Session & Partial<SessionData>;
        const role = session.role;
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
                args[2] = this.patientRepository;
                args[3] = this.doctorRepository;
                await validateCreate(role, args);
                break;
            case ActionType.UPDATE:
                const record = await this.recordRepository.findById(args[1]);
                args[1] = record;
                await validateUpdate(role, args);
                break;
        }
    }

    async after(action: ActionType, result: any, args: any[]): Promise<any> {
        const session = args[0] as Session & Partial<SessionData>;
        const role = session.role;
        if (role === UserType.ADMIN) {
            return result;
        }
        switch (action) {
            case ActionType.CREATE:
                await this.notificationService.create(session, {
                    title: 'Record Created',
                    message: 'Your record has been successfully created',
                    user_ids: [result.doctor_id, result.patient_id],
                    timestamp: new Date() // The notification would be sent immediately, this could be modified in a real-world scenario
                });
                break;
            case ActionType.UPDATE:
                await this.notificationService.create(session, {
                    title: 'Record Updated',
                    message: 'Your record has been successfully updated',
                    user_ids: [result.doctor_id, result.patient_id],
                    timestamp: new Date() // The notification would be sent immediately, this could be modified in a real-world scenario
                });
                break;
        }
    }

}