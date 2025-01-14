import {BaseRepository} from "../base/base.repository";
import {Patient} from "./patient.model";
import {EntityConfig} from "../base/base.model";
import {config } from "../../config/environment"
import {DatabaseService} from "../../database/database.service";
import {Service} from "typedi";


@Service()
export class PatientRepository extends BaseRepository<Patient> {
    protected entityConfig: EntityConfig<Patient> = config.entityValues.patient;

    constructor(
        protected databaseService: DatabaseService
    ) {
        super(databaseService);
    }

    // override methods and add parsing and stringify before calling the super methods
    public async create(patient: Patient): Promise<Patient> {
        this.stringifyFields(patient);
        const createdpatient = await super.create(patient);
        this.parseFields(createdpatient);
        return createdpatient;
    }

    public async update(id: number, patient: Partial<Patient>): Promise<Patient> {
        this.stringifyFields(patient);
        const updatedpatient = await super.update(id, patient);
        this.parseFields(updatedpatient);
        return updatedpatient;
    }

    public async delete(id: number): Promise<Patient> {
        const patient = await super.delete(id);
        this.parseFields(patient);
        return patient;
    }

    public async findById(id: number): Promise<Patient> {
        const patient = await super.findById(id);
        this.parseFields(patient);
        return patient;
    }

    public async findAll(): Promise<Patient[]> {
        const patients = await super.findAll();
        patients.forEach((patient) => this.parseFields(patient));
        return patients;
    }
}