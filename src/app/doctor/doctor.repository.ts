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
}