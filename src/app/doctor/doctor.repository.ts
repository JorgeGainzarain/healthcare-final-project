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
}