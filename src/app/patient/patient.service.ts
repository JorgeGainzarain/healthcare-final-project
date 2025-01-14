import {BaseService} from "../base/base.service";
import {Patient} from "./patient.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {PatientRepository} from "./patient.repository";
import {AuditService} from "../audit/audit.service";
import {Service} from "typedi";

@Service()
export class PatientService extends  BaseService<Patient> {
    protected entityConfig: EntityConfig<Patient> = config.entityValues.patient;

    constructor(
        protected auditService: AuditService,
        protected doctorRepository: PatientRepository
    ) {
        super(auditService, doctorRepository);
    }

}