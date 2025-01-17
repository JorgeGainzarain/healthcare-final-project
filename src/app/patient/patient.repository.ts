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
}