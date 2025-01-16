import { Container } from 'typedi';
import { AppointmentRepository } from '../appointment.repository';
import { SessionContext } from '../../../middleware/authentificate_JWT';
import { StatusError } from '../../../utils/status_error';
import { UserType } from '../../user/user.model';

export async function validateView(role: string, args: any) {
    const id = args[1];
    const appointment = await Container.get(AppointmentRepository).findById(id);
    if (role === UserType.DOCTOR) {
        if (appointment.doctor_id !== Container.get(SessionContext).doctorId) {
            throw new StatusError(403, 'You are not allowed to view appointments for another doctor');
        }
    }
    if (role === UserType.PATIENT) {
        if (appointment.patient_id !== Container.get(SessionContext).patientId) {
            throw new StatusError(403, 'You are not allowed to view appointments for another patient');
        }
    }
}