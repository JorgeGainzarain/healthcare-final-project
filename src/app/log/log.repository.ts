import { Service } from 'typedi';
import { DatabaseService } from "../../database/database.service";
import { Log } from './log.model';
import { BaseRepository } from "../base/base.repository";
import { config } from "../../config/environment";

@Service()
export class LogRepository extends BaseRepository<Log> {
    protected entityConfig = config.entityValues.log;

    constructor(
      protected databaseService: DatabaseService,
    ) {
      super(databaseService);
    }

    // override methods and add parsing and stringify before calling the super methods
    public async create(log: Log): Promise<Log> {
        this.stringifyFields(log);
        const createdLog = await super.create(log);
        this.parseFields(createdLog);
        return createdLog;
    }

    public async findById(id: number): Promise<Log> {
        const log = await super.findById(id);
        this.parseFields(log);
        return log;
    }

    public async findAll(): Promise<Log[]> {
        const logs = await super.findAll();
        logs.forEach((log) => this.parseFields(log));
        return logs;
    }

}
