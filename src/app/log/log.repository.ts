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

}
