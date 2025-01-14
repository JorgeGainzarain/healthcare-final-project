import {BaseController} from "../base/base.controller";
import {Department} from "./department.model";
import {DepartmentService} from "./department.service";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {Service} from "typedi";

@Service()
export class DepartmentController extends BaseController<Department> {
    protected entityConfig: EntityConfig<Department> = config.entityValues.department;

    constructor(
        protected departmentService: DepartmentService
    ) {
        super(departmentService);
        this.getRouter().get('', this.getAll.bind(this));
        this.getRouter().get('/:id', this.getById.bind(this));
        this.getRouter().post('', this.create.bind(this));
        this.getRouter().put('/:id', this.update.bind(this));
        this.getRouter().delete('/:id', this.delete.bind(this));
    }

}