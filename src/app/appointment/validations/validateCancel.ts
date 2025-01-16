import { Container } from 'typedi';
import { StatusError } from '../../../utils/status_error';
import { UserType } from '../../user/user.model';
import {AppointmentRepository} from "../appointment.repository";

export async function validateCancel(role: string, args: any) {
    const session = args[0];
    const id = args[1];
    const part_entity = await Container.get(AppointmentRepository).findById(id);
    if (!part_entity.appointment_details.status) {
        throw new StatusError(400, 'This appointment has already been cancelled');
    }
    if (role === UserType.DOCTOR) {
        throw new StatusError(403, 'Doctors are not allowed to cancel appointments');
    }
    if (role === UserType.PATIENT && part_entity.patient_id !== session.patientId) {
        throw new StatusError(403, 'You are not allowed to cancel an appointment for another patient');
    }
}