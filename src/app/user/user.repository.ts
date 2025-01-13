import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { User } from './user.model';
import { BaseRepository } from "../base/base.repository";
import { config } from "../../config/environment";


@Service()
export class UserRepository extends BaseRepository<User> {
    protected entityConfig = config.entityValues.user;

    constructor(
        protected readonly databaseService: DatabaseService
    ) {
        super(databaseService);
    }


    // Custom override of the findByFields method to search by username only
    async findByFields(fields: any): Promise<User | undefined> {

        const queryDoc = {
            sql: `SELECT * FROM ${this.entityConfig.table_name} WHERE username = ?`,
            params: [fields.username]
        };
        const result = await this.databaseService.execQuery(queryDoc);

        return result.rows[0] || undefined;
    }


}