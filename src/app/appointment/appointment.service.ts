import {BaseService} from "../base/base.service";
import {Appointment} from "./appointment.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {AppointmentRepository} from "./appointment.repository";
import {LogService} from "../log/log.service";
import {Service} from "typedi";

@Service()
export class AppointmentService extends  BaseService<Appointment> {
    protected entityConfig: EntityConfig<Appointment> = config.entityValues.appointment;

    constructor(
        protected auditService: LogService,
        protected appointmentRepository: AppointmentRepository
    ) {
        super(auditService, appointmentRepository);
    }

}