import {UserType} from "../../user/user.model";
import {StatusError} from "../../../utils/status_error";
import {Container} from "typedi";
import {RecordRepository} from "../record.repository";
import {SessionContext} from "../../../middleware/authentificate_JWT";


export async function validateUpdate(role: string, args: any) {
    const part_updates = args[2];
    const id = args[1];
    const record = await Container.get(RecordRepository).findById(id);
    const doctor_id = Container.get(SessionContext).doctorId;
    if (role !== UserType.DOCTOR) {
        throw new StatusError(403, 'Only doctors can update records');
    }
    if (record.doctor_id !== doctor_id) {
        throw new StatusError(403, 'You can only update records you created');
    }
    if (part_updates.doctor_id) {
        throw new StatusError(403, 'You cannot change the doctor of a record');
    }
}