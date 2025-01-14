import {BaseController} from "../base/base.controller";
import {Record} from "./record.model";
import {RecordService} from "./record.service";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {Service} from "typedi";

@Service()
export class RecordController extends BaseController<Record> {
    protected entityConfig: EntityConfig<Record> = config.entityValues.record;

    constructor(
        protected recordService: RecordService
    ) {
        super(recordService);
        this.getRouter().get('', this.getAll.bind(this));
        this.getRouter().get('/:id', this.getById.bind(this));
        this.getRouter().post('', this.create.bind(this));
        this.getRouter().put('/:id', this.update.bind(this));
        this.getRouter().delete('/:id', this.delete.bind(this));
    }

}