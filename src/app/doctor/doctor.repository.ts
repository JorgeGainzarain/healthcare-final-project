import {BaseRepository} from "../base/base.repository";
import {Doctor_Private, Doctor_Public} from "./doctor.model";
import {EntityConfig} from "../base/base.model";
import {config } from "../../config/environment"
import {DatabaseService} from "../../database/database.service";
import {Service} from "typedi";

@Service()
export class DoctorRepository extends BaseRepository<Doctor_Private | Doctor_Public> {
    protected entityConfig: EntityConfig<Doctor_Private | Doctor_Public> = config.entityValues.doctor;

    constructor(
        protected databaseService: DatabaseService
    ) {
        super(databaseService);
    }

    // Overrides
    async create(data: Doctor_Private): Promise<Doctor_Private | Doctor_Public> {
        this.stringifyFields(data);
        const doctor = await super.create(data);
        this.parseFields(doctor);
        return doctor;
    }

    async update(id: number, data: Partial<Doctor_Private>): Promise<Doctor_Private | Doctor_Public> {
        this.stringifyFields(data);
        const doctor = await super.update(id, data);
        this.parseFields(doctor);
        return doctor;
    }

    async findById(id: number): Promise<Doctor_Private | Doctor_Public> {
        const doctor = await super.findById(id);
        this.parseFields(doctor);
        return doctor;
    }

    async findAll(): Promise<(Doctor_Private | Doctor_Public)[]> {
        const doctors = await super.findAll();
        doctors.forEach(doctor => this.parseFields(doctor));
        return doctors;
    }

    async delete(id: number): Promise<Doctor_Private | Doctor_Public> {
        const doctor = await super.delete(id);
        this.parseFields(doctor);
        return doctor;
    }
}