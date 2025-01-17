import { StatusError } from '../../../utils/status_error';
import { UserType } from '../../user/user.model';

export async function validateCreate(role: string, args: any) {
    const session = args[0];
    const part_entity = args[1];

    if (role === UserType.PATIENT) {
        throw new StatusError(403, 'Patients are not allowed to create appointments');
    }
    if (role === UserType.DOCTOR) {
        if (part_entity.doctor_id !== session.doctorId) {
            throw new StatusError(403, 'You are not allowed to create an appointment for another doctor');
        }
    }

    const { patient_id, doctor_id } = part_entity;
    const patientRepository = args[2];
    const doctorRepository = args[3];

    if (!(await patientRepository.existsById(patient_id))) {
        throw new StatusError(404, 'Patient not found');
    }
    if (!(await doctorRepository.existsById(doctor_id))) {
        throw new StatusError(404, 'Doctor not found');
    }
}