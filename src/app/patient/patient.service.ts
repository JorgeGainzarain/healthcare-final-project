import {ActionType, BaseService} from "../base/base.service";
import {Patient} from "./patient.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {PatientRepository} from "./patient.repository";
import {LogService} from "../log/log.service";
import {Service} from "typedi";

import {validateUpdate} from "./validations/validateUpdate";
import {validateView} from "./validations/validateView";
import {UserType} from "../user/user.model";
import {StatusError} from "../../utils/status_error";
import {RecordRepository} from "../record/record.repository";
import {AppointmentRepository} from "../appointment/appointment.repository";
import {Session, SessionData } from "express-session";

@Service()
export class PatientService extends  BaseService<Patient> {
    protected entityConfig: EntityConfig<Patient> = config.entityValues.patient;

    constructor(
        protected patientRepository: PatientRepository,
        protected auditService: LogService,

        protected recordRepository: RecordRepository,
        protected appointmentRepository: AppointmentRepository
    ) {
        super(patientRepository, auditService);
        this.recordRepository = recordRepository;
        this.appointmentRepository = appointmentRepository;
    }

    async findAll(session: Session & SessionData): Promise<Patient[]> {
        const role = session.role;
        if (role === UserType.PATIENT) {
            throw new StatusError(403, 'Patients are not allowed to view all patients');
        }

        let patients: Patient[] = await this.patientRepository.findAll();
        const doctor_id = session.doctorId;

        let aux_patients = [];

        if (role !== UserType.ADMIN) {
            for (let i = 0; i < patients.length; i++) {
                const record = await this.recordRepository.exists({patient_id: patients[i].id, doctor_id: doctor_id});
                const appointment = await this.appointmentRepository.exists({patient_id: patients[i].id, doctor_id: doctor_id});
                if (record || appointment) {
                    aux_patients.push(patients[i]);
                }
            }

        }
        else {
            aux_patients = patients;
        }

        aux_patients.forEach((patient) => {
            console.log("Patient: " + patient.id);
        });

        await this.logAction(session.userId, aux_patients, 'retrieved');
        return aux_patients;
    }

    async before(action: ActionType, args: any) {
        const session = args[0] as Session & SessionData;
        const role = session.role;
        if (role == UserType.ADMIN) {
            return;
        }
        switch (action) {
            case ActionType.UPDATE:
                await validateUpdate(args);
                break;
            case ActionType.VIEW:
                await validateView(args);
                break
        }
    }

}