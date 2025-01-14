import {BaseRepository} from "../base/base.repository";
import {Doctor_Private} from "./doctor.model";
import {EntityConfig} from "../base/base.model";
import {config } from "../../config/environment"
import {DatabaseService} from "../../database/database.service";
import {Service} from "typedi";

@Service()
export class DoctorRepository extends BaseRepository<Doctor_Private> {
    protected entityConfig: EntityConfig<Doctor_Private> = config.entityValues.doctor;

    constructor(
        protected databaseService: DatabaseService
    ) {
        super(databaseService);
    }

    // Overrides
    async create(data: Doctor_Private): Promise<Doctor_Private> {
        this.stringifyFields(data);
        const doctor = await super.create(data);
        this.parseFields(doctor);
        return doctor;
    }

    async update(id: number, data: Partial<Doctor_Private>): Promise<Doctor_Private> {
        this.stringifyFields(data);
        const doctor = await super.update(id, data);
        this.parseFields(doctor);
        return doctor;
    }

    async findById(id: number): Promise<Doctor_Private> {
        const doctor = await super.findById(id);
        this.parseFields(doctor);
        return doctor;
    }

    async findAll(): Promise<Doctor_Private[]> {
        const doctors = await super.findAll();
        doctors.forEach(doctor => this.parseFields(doctor));
        return doctors;
    }

    async delete(id: number): Promise<Doctor_Private> {
        const doctor = await super.delete(id);
        this.parseFields(doctor);
        return doctor;
    }
}