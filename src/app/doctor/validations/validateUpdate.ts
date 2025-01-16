import {UserType} from "../../user/user.model";
import {StatusError} from "../../../utils/status_error";
import {Container} from "typedi";
import {Session, SessionData} from "express-session";

export async function validateUpdate(args: any) {
    const session = args[0] as Session & SessionData;
    const role = session.role;
    const id = args[1];
    const doctor_id = session.doctorId;
    if (role === UserType.PATIENT) {
        throw new StatusError(403, 'Patients are not allowed to update doctors');
    }
    if (role === UserType.DOCTOR) {
        if (doctor_id !== id) {
            throw new StatusError(403, 'You are not allowed to update another doctor');
        }
        // The user id or doctor id cannot be updated
        const part_updates = args[2];
        if (part_updates.id || part_updates.user_id || part_updates.doctor_id) {
            throw new StatusError(403, 'You are not allowed to update the user id or doctor id');
        }
    }
}