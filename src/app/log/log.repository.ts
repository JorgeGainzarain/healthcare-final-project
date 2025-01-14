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

    // Custom override of the create method to insert the message into the database
    async create(entity: Log): Promise<Log> {
        const queryDoc = {
            sql: `INSERT INTO ${this.entityConfig.table_name} (message) VALUES (?)`,
            params: [entity.message]
        };

        const result = await this.databaseService.execQuery(queryDoc);


        return result.rows[0];
    }

}
