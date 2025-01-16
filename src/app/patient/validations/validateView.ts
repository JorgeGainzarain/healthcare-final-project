import { Container } from 'typedi';
import { PatientRepository } from "../patient.repository";
import { RecordRepository } from "../../record/record.repository";
import { AppointmentRepository} from "../../appointment/appointment.repository";
import {UserType} from "../../user/user.model";
import {StatusError} from "../../../utils/status_error";
import {Session, SessionData} from "express-session";

export async function validateView(args: any) {
    const session = args[0] as Session & SessionData;
    const id = args[1];
    const role = session.role;

    if (role == UserType.PATIENT) {
        const patient_id = session.patientId;
        if (patient_id !== id) {
            throw new StatusError(403, 'You are not allowed to view another patient');
        }
    }
    if (role == UserType.DOCTOR) {
        const doctor_id = session.doctorId;
        const patientRepository = Container.get(PatientRepository);
        const patient = await patientRepository.findById(id);
        if (!patient) {
            throw new StatusError(404, 'Patient not found');
        }

        // We should check if the patient has an appointment or record in common with the doctor
        const recordRepository = Container.get(RecordRepository);
        const appointmentRepository = Container.get(AppointmentRepository);

        console.log('1 -> Doctor' + doctor_id + ' trying to access patient' + patient.id);

        const record = await recordRepository.exists({patient_id: patient.id, doctor_id: doctor_id});
        const appointment = await appointmentRepository.exists({patient_id: patient.id, doctor_id: doctor_id});
        console.log('Doctor' + doctor_id + ' trying to access patient' + patient.id);
        if (!record && !appointment) {
            throw new StatusError(403, 'You are not allowed to view this patient');
        }
        else {
            console.log('Doctor has access to patient');
        }
    }

}