import {BaseController} from "../base/base.controller";
import {Patient} from "./patient.model";
import {PatientService} from "./patient.service";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {Service} from "typedi";

@Service()
export class PatientController extends BaseController<Patient> {
    protected entityConfig: EntityConfig<Patient> = config.entityValues.patient;

    constructor(
        protected doctorService: PatientService
    ) {
        super(doctorService);
        this.getRouter().get('', this.getAll.bind(this));
        this.getRouter().get('/:id', this.getById.bind(this));
        this.getRouter().post('', this.create.bind(this));
        this.getRouter().put('/:id', this.update.bind(this));
        this.getRouter().delete('/:id', this.delete.bind(this));
    }

}