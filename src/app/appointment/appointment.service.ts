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

import { validateView } from './validations/validateView';
import { validateCreate } from './validations/validateCreate';
import { validateCancel } from './validations/validateCancel';
import { validateUpdate } from './validations/validateUpdate';

@Service()
export class AppointmentService extends BaseService<Appointment> {
    protected entityConfig: EntityConfig<Appointment> = config.entityValues.appointment;

    constructor(
        protected appointmentRepository: AppointmentRepository,
        protected auditService: LogService
    ) {
        super(appointmentRepository, auditService);
    }

    async delete(userId: number, id: number): Promise<Appointment> {
        await this.before(ActionType.DELETE, [userId, id]);
        // Modify the appointment status to cancelled
        const appointment = await this.appointmentRepository.findById(id);
        appointment.appointment_details.status = false;
        const updatedAppointment = await this.appointmentRepository.update(id, appointment);
        await this.logAction(userId, updatedAppointment, 'deleted');
        return updatedAppointment;
    }

    async findAll(user_id: number): Promise<Appointment[]> {
        let appointments = await this.appointmentRepository.findAll();
        if (Container.get(SessionContext).role !== UserType.ADMIN) {
            appointments = appointments.filter(appointment => {
                try {
                    validateView(UserType.PATIENT, [user_id, appointment.id]);
                    return true;
                }
                catch (e) {
                    return false;
                }
            });
        }
        await this.logAction(user_id, appointments, 'retrieved');
        return appointments;
    }

    async before(action: ActionType, args: any[]) {
        const role = Container.get(SessionContext).role;
        if (!role) {
            throw new StatusError(403, 'You must be logged in to perform this action');
        }
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
            case ActionType.DELETE:
                await validateCancel(role, args);
                break;
            case ActionType.UPDATE:
                await validateUpdate(role, args);
                break;
        }
    }
}


