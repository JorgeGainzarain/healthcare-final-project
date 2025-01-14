import {BaseController} from "../base/base.controller";
import {Log} from "./log.model";
import {EntityConfig} from "../base/base.model";
import {Service} from "typedi";
import { config } from "../../config/environment";
import {LogService} from "./log.service";

@Service()
export class LogController extends BaseController<Log> {
    protected entityConfig: EntityConfig<Log> = config.entityValues.log
    constructor(
        logService: LogService
    ) {
        super(logService);
        this.getRouter().get('/', this.getAll.bind(this));
        this.getRouter().get('/:id', this.getById.bind(this));
    }

}