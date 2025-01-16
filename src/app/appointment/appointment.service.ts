// src/app/appointment/appointment.service.ts
import {BaseService} from '../base/base.service';
import {Appointment} from './appointment.model';
import {EntityConfig} from '../base/base.model';
import {config} from '../../config/environment';
import {AppointmentRepository} from './appointment.repository';
import {LogService} from '../log/log.service';
import {Container, Service} from 'typedi';
import {SessionContext} from "../../middleware/authentificate_JWT";
import {StatusError} from "../../utils/status_error";
import {UserType} from "../user/user.model";
import {validateObject} from "../../utils/validation";

@Service()
export class AppointmentService extends BaseService<Appointment> {
    protected entityConfig: EntityConfig<Appointment> = config.entityValues.appointment;

    constructor(
        protected appointmentRepository: AppointmentRepository,
        protected auditService: LogService
    ) {
        super(appointmentRepository, auditService);
    }

    @validateAuth('create')
    async create(user_id: number, part_entity: Partial<Appointment>): Promise<Appointment> {
        return super.create(user_id, part_entity);
    }

    @validateAuth('update')
    async update(user_id: number, id: number, part_updates: Partial<Appointment>): Promise<Appointment> {
        return super.update(user_id, id, part_updates);
    }

    @validateAuth('cancel')
    async delete(user_id: number, id: number): Promise<Appointment> {
        return super.delete(user_id, id);
    }

    @validateAuth('view')
    async findById(user_id: number, id: number): Promise<Appointment> {
        return super.findById(user_id, id);
    }

}

function validateAuth(action: 'view' | 'create' | 'cancel' | 'update') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const sessionContext = Container.get(SessionContext);
            if (!sessionContext) {
                throw new StatusError(500, 'Session context is missing');
            }

            const part_entity = args[1];
            const role = sessionContext.role;
            if (!role) {
                throw new StatusError(403, 'You are not authorized to perform this action');
            }

            await validateAction(action, role, part_entity, args);

            return await originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

async function validateAction(action: 'view' | 'create' | 'cancel' | 'update', role: string, part_entity: any, args: any[]) {
    switch (action) {
        case 'view':
            await validateView(role, part_entity);
            break;
        case 'create':
            await validateCreate(role, part_entity);
            break;
        case 'cancel':
            await validateCancel(role, part_entity);
            break;
        case 'update':
            await validateUpdate(role, part_entity, args[2]);
            break;
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

async function validateUpdate(role: string, part_entity: any, part_updates: any) {
    if (!part_updates || !validateObject(part_updates, [{ name: 'date', type: 'TEXT' }])) {
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