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
    public async create(doctor: Patient): Promise<Patient> {
        this.stringifyFields(doctor);
        const createdDoctor = await super.create(doctor);
        this.parseFields(createdDoctor);
        return createdDoctor;
    }

    public async update(id: number, doctor: Partial<Patient>): Promise<Patient> {
        this.stringifyFields(doctor);
        const updatedDoctor = await super.update(id, doctor);
        this.parseFields(updatedDoctor);
        return updatedDoctor;
    }

    public async delete(id: number): Promise<Patient> {
        const doctor = await super.delete(id);
        this.parseFields(doctor);
        return doctor;
    }

    public async findById(id: number): Promise<Patient> {
        const doctor = await super.findById(id);
        this.parseFields(doctor);
        return doctor;
    }

    public async findAll(): Promise<Patient[]> {
        const doctors = await super.findAll();
        doctors.forEach((doctor) => this.parseFields(doctor));
        return doctors;
    }


    // Helper functions for parsing and stringify JSON and array fields
    protected stringifyFields(doctor: Partial<Patient>): void {
        // iterate over the Patient fields and stringify the JSON or [] fields
        Object.keys(doctor).forEach((key: string) => {
            if (this.entityConfig.requiredFields.find((field) => field.name === key)) {
                const fieldKey = key as keyof Partial<Patient>;
                if (typeof doctor[fieldKey] === 'object' && doctor[fieldKey] !== undefined) {
                    doctor[fieldKey] = JSON.stringify(doctor[fieldKey]) as any;
                }
            }
        });
    }

    protected parseFields(doctor: Partial<Patient>): void {
        // iterate over the Patient fields and parse the JSON or [] fields
        Object.keys(doctor).forEach((key: string) => {
            let field = this.entityConfig.requiredFields.find((field) => field.name === key)
            if (field && (field.type.endsWith('[]') || field.type === 'JSON')) {
                const fieldKey = key as keyof Partial<Patient>;
                if (typeof doctor[fieldKey] === 'string') {
                    doctor[fieldKey] = JSON.parse(doctor[fieldKey]) as any;
                }
            }
        });
    }
}