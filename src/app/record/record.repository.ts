import {BaseRepository} from "../base/base.repository";
import {Record} from "./record.model";
import {EntityConfig} from "../base/base.model";
import {config } from "../../config/environment"
import {DatabaseService} from "../../database/database.service";
import {Service} from "typedi";

@Service()
export class RecordRepository extends BaseRepository<Record> {
    protected entityConfig: EntityConfig<Record> = config.entityValues.record;

    constructor(
        protected databaseService: DatabaseService
    ) {
        super(databaseService);
    }
}