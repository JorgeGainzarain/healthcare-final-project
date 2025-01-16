import {BaseService} from "../base/base.service";
import {Notification} from "./notification.model";
import {LogService} from "../log/log.service";
import {config} from "../../config/environment";
import {EntityConfig} from "../base/base.model";
import {Service} from "typedi";
import {NotificationRepository} from "./notification.repository";

@Service()
export class NotificationService extends BaseService<Notification> {
    protected entityConfig: EntityConfig<Notification> = config.entityValues.notification;

    constructor(
        protected notificationRepository: NotificationRepository,
        protected auditService: LogService
    ) {
        super(notificationRepository, auditService);
    }
}