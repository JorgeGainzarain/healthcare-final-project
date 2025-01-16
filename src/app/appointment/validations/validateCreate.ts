import { Container } from 'typedi';
import { PatientRepository } from '../../patient/patient.repository';
import { DoctorRepository } from '../../doctor/doctor.repository';
import { SessionContext } from '../../../middleware/authentificate_JWT';
import { StatusError } from '../../../utils/status_error';
import { UserType } from '../../user/user.model';
import moment from 'moment';
import { DoctorAvailability } from '../../doctor/doctor.model';

export async function validateCreate(role: string, args: any) {
    const part_entity = args[1];

    if (role === UserType.DOCTOR) {
        throw new StatusError(403, 'Doctors are not allowed to create appointments');
    }
    if (role === UserType.PATIENT) {
        if (part_entity.patient_id !== Container.get(SessionContext).patientId) {
            throw new StatusError(403, 'You are not allowed to create an appointment for another patient');
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

    const appointment_date = moment(part_entity.appointment_details.date);
    if (!appointment_date.isValid()) {
        throw new StatusError(400, 'Invalid appointment date');
    }
    if (appointment_date.isBefore(moment())) {
        throw new StatusError(400, 'You cannot create an appointment for a past date');
    }

    const doctor = await Container.get(DoctorRepository).findById(part_entity.doctor_id);
    const availability = new DoctorAvailability(doctor.availability);
    if (!availability.isAvailable(appointment_date)) {
        throw new StatusError(400, 'Doctor is not available on the selected date');
    }
}