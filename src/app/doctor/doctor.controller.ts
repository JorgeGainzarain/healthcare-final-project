import {BaseController} from "../base/base.controller";
import {Doctor_Private} from "./doctor.model";
import {DoctorService} from "./doctor.service";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {Service} from "typedi";

@Service()
export class DoctorController extends BaseController<Doctor_Private> {
    protected entityConfig: EntityConfig<Doctor_Private> = config.entityValues.doctor;

    constructor(
        protected doctorService: DoctorService
    ) {
        super(doctorService);
        this.getRouter().get('', this.getAll.bind(this));
        this.getRouter().get('/:id', this.getById.bind(this));
        this.getRouter().post('', this.create.bind(this));
        this.getRouter().put('/:id', this.update.bind(this));
        this.getRouter().delete('/:id', this.delete.bind(this));
    }

}