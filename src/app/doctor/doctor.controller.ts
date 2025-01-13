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
        this.getRouter().get('').bind(this.getAll);
        this.getRouter().get('/:id').bind(this.getById);
        this.getRouter().post('').bind(this.create);
        this.getRouter().put('/:id').bind(this.update);
        this.getRouter().delete('/:id').bind(this.delete);
    }
}