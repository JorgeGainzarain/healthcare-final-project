// src/app/appointment/appointment.service.ts
import {ActionType, BaseService} from '../base/base.service';
import {Appointment} from './appointment.model';
import {EntityConfig} from '../base/base.model';
import {config} from '../../config/environment';
import {AppointmentRepository} from './appointment.repository';
import {LogService} from '../log/log.service';
import {Container, Service} from 'typedi';
import {SessionContext} from "../../middleware/authentificate_JWT";
import {StatusError} from "../../utils/status_error";
import {UserType} from "../user/user.model";

@Service()
export class AppointmentService extends BaseService<Appointment> {
    protected entityConfig: EntityConfig<Appointment> = config.entityValues.appointment;

    constructor(
        protected appointmentRepository: AppointmentRepository,
        protected auditService: LogService
    ) {
        super(appointmentRepository, auditService);
    }

    async before(action: ActionType , args: any[]) {
        const role = Container.get(SessionContext).role;
        if (!role) {
            throw new StatusError(403, 'You must be logged in to perform this action');
        }
        if (role === UserType.ADMIN) {
            return;
        }
        switch (action) {
            case ActionType.VIEW:
                await validateView(role, args);
                break;
            case ActionType.CREATE:
                await validateCreate(role, args);
                break;
            case ActionType.DELETE:
                await validateCancel(role, args);
                break;
            case ActionType.UPDATE:
                await validateUpdate(role, args);
                break;
        }
    }
}


async function validateView(role: string, part_entity: any) {
    if (role === UserType.DOCTOR) {
        if (part_entity.patient_id !== Container.get(SessionContext).patientId) {
            throw new StatusError(403, 'You are not allowed to view appointments for another patient');
        }
        if (part_entity.doctor_id !== Container.get(SessionContext).doctorId) {
            throw new StatusError(403, 'You are not allowed to view appointments for another doctor');
        }
    }
}

async function validateCreate(role: string, part_entity: any) {
    console.log('' + part_entity.patient_id + ' ' + Container.get(SessionContext).patientId);
    if (role === UserType.DOCTOR) {
        throw new StatusError(403, 'Doctors are not allowed to create appointments');
    }
    if (role === UserType.PATIENT && part_entity.patient_id !== Container.get(SessionContext).patientId) {
        throw new StatusError(403, 'You are not allowed to create an appointment for another patient');
    }
}

async function validateCancel(role: string, part_entity: any) {
    if (role === UserType.DOCTOR) {
        throw new StatusError(403, 'Doctors are not allowed to cancel appointments');
    }
    if (role === UserType.PATIENT && part_entity.patient_id !== Container.get(SessionContext).patientId) {
        throw new StatusError(403, 'You are not allowed to cancel an appointment for another patient');
    }
}

async function validateUpdate(role: string, args: any) {
    const part_updates = args[2];
    const id = args[1];
    const part_entity = await Container.get(AppointmentService).findById(-1,  id);
    if (!part_updates || Object.keys(part_updates.appointment_details).length !== 1 || typeof part_updates.appointment_details.date !== 'string') {
        throw new StatusError(400, 'Invalid appointment reschedule request');
    }
    if (role === UserType.PATIENT && part_entity.patient_id !== Container.get(SessionContext).patientId) {
        throw new StatusError(403, 'You are not allowed to reschedule an appointment for another patient');
    }
    if (role === UserType.DOCTOR && part_entity.doctor_id !== Container.get(SessionContext).doctorId) {
        throw new StatusError(403, 'You are not allowed to reschedule an appointment for another doctor');
    }
    if (part_updates.date < new Date().toISOString()) {
        throw new StatusError(400, 'You cannot reschedule an appointment to a past date');
    }
}