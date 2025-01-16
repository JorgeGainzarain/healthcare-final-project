import { Container } from 'typedi';
import { PatientRepository } from '../../patient/patient.repository';
import { DoctorRepository } from '../../doctor/doctor.repository';
import { SessionContext } from '../../../middleware/authentificate_JWT';
import { StatusError } from '../../../utils/status_error';
import { UserType } from '../../user/user.model';

export async function validateCreate(role: string, args: any) {
    const part_entity = args[1];

    if (role === UserType.PATIENT) {
        throw new StatusError(403, 'Patients are not allowed to create appointments');
    }
    if (role === UserType.DOCTOR) {
        if (part_entity.doctor_id !== Container.get(SessionContext).doctorId) {
            throw new StatusError(403, 'You are not allowed to create an appointment for another doctor');
        }
    }

    const { patient_id, doctor_id } = part_entity;
    const patientRepository = Container.get(PatientRepository);
    const doctorRepository = Container.get(DoctorRepository);

    if (!(await patientRepository.existsById(patient_id))) {
        throw new StatusError(404, 'Patient not found');
    }
    if (!(await doctorRepository.existsById(doctor_id))) {
        throw new StatusError(404, 'Doctor not found');
    }
}