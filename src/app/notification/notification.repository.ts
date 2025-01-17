import {BaseRepository} from "../base/base.repository";
import {Notification} from "./notification.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {Service} from "typedi";
import {DatabaseService} from "../../database/database.service";

@Service()
export class NotificationRepository extends BaseRepository<Notification> {
    protected entityConfig: EntityConfig<Notification> = config.entityValues.notification;

    constructor(
        protected databaseService: DatabaseService
    ) {
        super(databaseService);
    }
}