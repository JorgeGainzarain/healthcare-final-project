import {BaseService} from "../base/base.service";
import {Record} from "./record.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {RecordRepository} from "./record.repository";
import {LogService} from "../log/log.service";
import {Service} from "typedi";

@Service()
export class RecordService extends  BaseService<Record> {
    protected entityConfig: EntityConfig<Record> = config.entityValues.record;

    constructor(
        protected auditService: LogService,
        protected recordRepository: RecordRepository
    ) {
        super(auditService, recordRepository);
    }

}