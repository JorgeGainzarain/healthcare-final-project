import {ActionType, BaseService} from "../base/base.service";
import {Patient} from "./patient.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {PatientRepository} from "./patient.repository";
import {LogService} from "../log/log.service";
import {Container, Service} from "typedi";

import {validateUpdate} from "./validations/validateUpdate";
import {validateView} from "./validations/validateView";
import {SessionContext} from "../../middleware/authentificate_JWT";
import {UserType} from "../user/user.model";
import {StatusError} from "../../utils/status_error";
import {RecordRepository} from "../record/record.repository";
import {AppointmentRepository} from "../appointment/appointment.repository";

@Service()
export class PatientService extends  BaseService<Patient> {
    protected entityConfig: EntityConfig<Patient> = config.entityValues.patient;

    constructor(
        protected patientRepository: PatientRepository,
        protected auditService: LogService
    ) {
        super(patientRepository, auditService);
    }

    async findAll(user_id: number): Promise<Patient[]> {
        const role = Container.get(SessionContext).role;
        if (!role) {
            throw new StatusError(403, 'You must be logged in to perform this action');
        }
        if (role === UserType.PATIENT) {
            throw new StatusError(403, 'Patients are not allowed to view all patients');
        }

        let patients: Patient[] = await this.patientRepository.findAll();
        const doctor_id = Container.get(SessionContext).doctorId;


        const recordRepository = Container.get(RecordRepository);
        const appointmentRepository = Container.get(AppointmentRepository);

        const aux_patients = [];

        if (role !== UserType.ADMIN) {
            for (let i = 0; i < patients.length; i++) {
                const record = await recordRepository.exists({patient_id: patients[i].id, doctor_id: doctor_id});
                const appointment = await appointmentRepository.exists({patient_id: patients[i].id, doctor_id: doctor_id});
                if (record || appointment) {
                    aux_patients[i] = patients[i];
                }
            }

        }
        await this.logAction(user_id, aux_patients, 'retrieved');
        return aux_patients;
    }

    async before(action: ActionType, args: any) {
        const role = Container.get(SessionContext).role;
        if (!role) {
            throw new StatusError(401, 'Access token is missing or invalid');
        }
        if (role == UserType.ADMIN) {
            return;
        }
        switch (action) {
            case ActionType.UPDATE:
                await validateUpdate(role, args);
                break;
            case ActionType.VIEW:
                await validateView(role, args);
                break
        }
    }

}