import {UserType} from "../../user/user.model";
import {StatusError} from "../../../utils/status_error";
import {Container} from "typedi";
import {SessionContext} from "../../../middleware/authentificate_JWT";


export async function validateUpdate(role: string, args: any) {
    const id = args[1];
    const patient_id = Container.get(SessionContext).patientId;
    if (role === UserType.DOCTOR) {
        throw new StatusError(403, 'Doctors are not allowed to update patients');
    }
    if (role === UserType.PATIENT) {
        if (patient_id !== id) {
            throw new StatusError(403, 'You are not allowed to update another patient');
        }
    }
}