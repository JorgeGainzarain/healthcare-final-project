import {BaseController} from "../base/base.controller";
import {Appointment} from "./appointment.model";
import {AppointmentService} from "./appointment.service";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {Service} from "typedi";

@Service()
export class AppointmentController extends BaseController<Appointment> {
    protected entityConfig: EntityConfig<Appointment> = config.entityValues.appointment;

    constructor(
        protected appointmentService: AppointmentService
    ) {
        super(appointmentService);
        this.getRouter().get('', this.getAll.bind(this));
        this.getRouter().get('/:id', this.getById.bind(this));
        this.getRouter().post('', this.create.bind(this));
        this.getRouter().put('/:id', this.update.bind(this));
        this.getRouter().delete('/:id', this.delete.bind(this));
    }

}