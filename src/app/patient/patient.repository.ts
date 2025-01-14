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


    // Helper functions for parsing and stringify JSON and array fields
    protected stringifyFields(patient: Partial<Patient>): void {
        // iterate over the Patient fields and stringify the JSON or [] fields
        Object.keys(patient).forEach((key: string) => {
            if (this.entityConfig.requiredFields.find((field) => field.name === key)) {
                const fieldKey = key as keyof Partial<Patient>;
                if (typeof patient[fieldKey] === 'object' && patient[fieldKey] !== undefined) {
                    patient[fieldKey] = JSON.stringify(patient[fieldKey]) as any;
                }
            }
        });
    }

    protected parseFields(patient: Partial<Patient>): void {
        // iterate over the Patient fields and parse the JSON or [] fields
        Object.keys(patient).forEach((key: string) => {
            let field = this.entityConfig.requiredFields.find((field) => field.name === key)
            if (field && (field.type.endsWith('[]') || field.type === 'JSON')) {
                const fieldKey = key as keyof Partial<Patient>;
                if (typeof patient[fieldKey] === 'string') {
                    patient[fieldKey] = JSON.parse(patient[fieldKey]) as any;
                }
            }
        });
    }
}