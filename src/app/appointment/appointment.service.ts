// src/app/appointment/appointment.service.ts
import {ActionType, BaseService} from '../base/base.service';
import {Appointment} from './appointment.model';
import {EntityConfig} from '../base/base.model';
import {config} from '../../config/environment';
import {AppointmentRepository} from './appointment.repository';
import {LogService} from '../log/log.service';
import {Container, Service} from 'typedi';
import {StatusError} from "../../utils/status_error";
import {UserType} from "../user/user.model";

import { validateView } from './validations/validateView';
import { validateCreate } from './validations/validateCreate';
import { validateCancel } from './validations/validateCancel';
import { validateUpdate } from './validations/validateUpdate';
import {Session, SessionData } from "express-session";
import {NotificationService} from "../notification/notification.service";

@Service()
export class AppointmentService extends BaseService<Appointment> {
    protected entityConfig: EntityConfig<Appointment> = config.entityValues.appointment;

    constructor(
        protected appointmentRepository: AppointmentRepository,
        protected logService: LogService,

    protected notificationService: NotificationService
) {
        super(appointmentRepository, logService);
        this.notificationService = Container.get(NotificationService);
    }

    async delete(session: Session & Partial<SessionData>, id: number): Promise<Appointment> {
        const userId = session.userId;
        await this.before(ActionType.DELETE, [session, id]);
        // Modify the appointment status to cancelled
        const appointment = await this.appointmentRepository.findById(id);
        appointment.appointment_details.status = false;
        const updatedAppointment = await this.appointmentRepository.update(id, appointment);
        await this.logAction(userId!, updatedAppointment, 'deleted');
        return updatedAppointment;
    }

    async findAll(session: Session & Partial<SessionData>): Promise<Appointment[]> {
        const user_id = session.userId;
        let appointments = await this.appointmentRepository.findAll();
        if (session.role !== UserType.ADMIN) {
            appointments = appointments.filter(async (appointment) => {
                try {
                    await validateView(UserType.PATIENT, [session, appointment]);
                    return true;
                }
                catch (e) {
                    return false;
                }
            });
        }
        await this.logAction(user_id!, appointments, 'retrieved');
        return appointments;
    }

    async before(action: ActionType, args: any[]) {
        const session = args[0];
        const role = session.role;
        if (!role) {
            throw new StatusError(403, 'You must be logged in to perform this action');
        }
        if (role === UserType.ADMIN) {
            return;
        }
        switch (action) {
            case ActionType.VIEW :
                args[1] = await this.appointmentRepository.findById(args[1]);
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

    async after(action: ActionType, result: any, args: any[]): Promise<any> {
        const session = args[0];
        const role = session.role;
        if (role === UserType.ADMIN) {
            return;
        }
        if (result as Appointment === undefined) {
            throw new StatusError(500, 'Internal server error');
        }
        switch (action) {
            case ActionType.CREATE:
                await this.notificationService.create(session, {
                    title: 'Appointment Created',
                    message: 'Your appointment has been successfully created',
                    user_ids: [result.doctor_id, result.patient_id],
                    timestamp: new Date() // The notification would be sent immediately, this could be modified in a real-world scenario
                });
                break;
            case ActionType.UPDATE:
                await this.notificationService.create(session, {
                    title: 'Appointment Rescheduled',
                    message: 'Your appointment has been successfully rescheduled',
                    user_ids: [result.doctor_id, result.patient_id],
                    timestamp: new Date()
                });
                break;
            case ActionType.DELETE:
                await this.notificationService.create(session, {
                    title: 'Appointment Cancelled',
                    message: 'Your appointment has been successfully cancelled',
                    user_ids: [result.doctor_id, result.patient_id],
                    timestamp: new Date()
                });
                break;
        }
    }
}


