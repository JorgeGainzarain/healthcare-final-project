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

    // Overrides
    async create(data: Appointment): Promise<Appointment> {
        this.stringifyFields(data);
        const appointment = await super.create(data);
        this.parseFields(appointment);
        return appointment;
    }

    async update(id: number, data: Partial<Appointment>): Promise<Appointment> {
        this.stringifyFields(data);
        const appointment = await super.update(id, data);
        this.parseFields(appointment);
        return appointment;
    }

    async findById(id: number): Promise<Appointment> {
        const appointment = await super.findById(id);
        this.parseFields(appointment);
        return appointment;
    }

    async findAll(): Promise<Appointment[]> {
        const appointments = await super.findAll();
        appointments.forEach(appointment => this.parseFields(appointment));
        return appointments;
    }

    async delete(id: number): Promise<Appointment> {
        const appointment = await super.delete(id);
        this.parseFields(appointment);
        return appointment;
    }
}