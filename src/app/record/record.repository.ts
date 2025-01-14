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

    // Overrides
    async create(data: Record): Promise<Record> {
        this.stringifyFields(data);
        const record = await super.create(data);
        this.parseFields(record);
        return record;
    }

    async update(id: number, data: Partial<Record>): Promise<Record> {
        this.stringifyFields(data);
        const record = await super.update(id, data);
        this.parseFields(record);
        return record;
    }

    async findById(id: number): Promise<Record> {
        const record = await super.findById(id);
        this.parseFields(record);
        return record;
    }

    async findAll(): Promise<Record[]> {
        const records = await super.findAll();
        records.forEach(record => this.parseFields(record));
        return records;
    }

    async delete(id: number): Promise<Record> {
        const record = await super.delete(id);
        this.parseFields(record);
        return record;
    }
}