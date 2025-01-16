import {UserType} from "../../user/user.model";
import {StatusError} from "../../../utils/status_error";
import {Container} from "typedi";
import {Session, SessionData} from "express-session";


export async function validateUpdate(args: any) {
    const session = args[0] as Session & SessionData;
    const id = args[1];
    const patient_id = session.patientId;
    const role = session.role;
    if (role === UserType.DOCTOR) {
        throw new StatusError(403, 'Doctors are not allowed to update patients');
    }
    if (role === UserType.PATIENT) {
        if (patient_id !== id) {
            throw new StatusError(403, 'You are not allowed to update another patient');
        }
    }
}