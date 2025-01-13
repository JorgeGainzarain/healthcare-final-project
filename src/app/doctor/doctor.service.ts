import {BaseService} from "../base/base.service";
import {Doctor_Private} from "./doctor.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {DoctorRepository} from "./doctor.repository";
import {AuditService} from "../audit/audit.service";

export class DoctorService extends  BaseService<Doctor_Private> {
    protected entityConfig: EntityConfig<Doctor_Private> = config.entityValues.doctor;

    constructor(
        protected auditService: AuditService,
        protected doctorRepository: DoctorRepository
    ) {
        super(auditService, doctorRepository);
    }

}