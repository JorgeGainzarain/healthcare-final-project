import { Container } from 'typedi';
import {RecordRepository} from "../record.repository";
import {UserType} from "../../user/user.model";
import {SessionContext} from "../../../middleware/authentificate_JWT";
import {StatusError} from "../../../utils/status_error";

export async function validateView(role: string, args: any) {
    const id = args[1];
    const record = await Container.get(RecordRepository).findById(id);
    if (role === UserType.DOCTOR) {
        if (record.doctor_id !== Container.get(SessionContext).doctorId) {
            throw new StatusError(403, 'You are not allowed to view records for another doctor');
        }
    }
    if (role === UserType.PATIENT) {
        if (record.patient_id !== Container.get(SessionContext).patientId) {
            throw new StatusError(403, 'You are not allowed to view records for another patient');
        }
    }
}