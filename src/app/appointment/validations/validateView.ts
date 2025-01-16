import { Container } from 'typedi';
import { AppointmentRepository } from '../appointment.repository';
import { StatusError } from '../../../utils/status_error';
import { UserType } from '../../user/user.model';
import {Appointment} from "../appointment.model";

export async function validateView(role: string, args: any) {
    const session = args[0];
    const appointment = args[1] as Appointment;
    if (role === UserType.DOCTOR) {
        if (appointment.doctor_id !== session.doctorId) {
            throw new StatusError(403, 'You are not allowed to view appointments for another doctor');
        }
    }
    if (role === UserType.PATIENT) {
        if (appointment.patient_id !== session.patientId) {
            throw new StatusError(403, 'You are not allowed to view appointments for another patient');
        }
    }
}