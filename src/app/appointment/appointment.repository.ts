import {BaseRepository} from "../base/base.repository";
import {Appointment} from "./appointment.model";
import {EntityConfig} from "../base/base.model";
import {config } from "../../config/environment"
import {DatabaseService} from "../../database/database.service";
import {Service} from "typedi";

@Service()
export class AppointmentRepository extends BaseRepository<Appointment> {
    protected entityConfig: EntityConfig<Appointment> = config.entityValues.appointment;

    constructor(
        protected databaseService: DatabaseService
    ) {
        super(databaseService);
    }

    async findByFields(fields: Partial<Appointment>): Promise<Appointment | undefined> {
        const searchFields: any = {};
        if (fields.patient_id !== undefined) searchFields.patient_id = fields.patient_id;
        if (fields.doctor_id !== undefined) searchFields.doctor_id = fields.doctor_id;
        if (fields.appointment_details?.status !== undefined) {
            searchFields.appointment_details = { status: fields.appointment_details.status };
        }
        return await super.findByFields(searchFields);
    }
}