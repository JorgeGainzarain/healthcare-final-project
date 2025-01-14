import {BaseService} from "../base/base.service";
import {Appointment} from "./appointment.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {AppointmentRepository} from "./appointment.repository";
import {AuditService} from "../audit/audit.service";
import {Service} from "typedi";

@Service()
export class AppointmentService extends  BaseService<Appointment> {
    protected entityConfig: EntityConfig<Appointment> = config.entityValues.appointment;

    constructor(
        protected auditService: AuditService,
        protected appointmentRepository: AppointmentRepository
    ) {
        super(auditService, appointmentRepository);
    }

}