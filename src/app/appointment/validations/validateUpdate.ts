import { Container } from 'typedi';
import { AppointmentService } from '../appointment.service';
import { SessionContext } from '../../../middleware/authentificate_JWT';
import { StatusError } from '../../../utils/status_error';
import { UserType } from '../../user/user.model';

export async function validateUpdate(role: string, args: any) {
    const part_updates = args[2];
    const id = args[1];
    const part_entity = await Container.get(AppointmentService).findById(-1, id);
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