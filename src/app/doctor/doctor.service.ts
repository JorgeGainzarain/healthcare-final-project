import {ActionType, BaseService} from "../base/base.service";
import {Doctor_Private, Doctor_Public} from "./doctor.model";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {DoctorRepository} from "./doctor.repository";
import {LogService} from "../log/log.service";
import {Container, Service} from "typedi";
import {StatusError} from "../../utils/status_error";
import {UserType} from "../user/user.model";
import {validateUpdate} from "./validations/validateUpdate";
import {Session, SessionData} from "express-session";

@Service()
export class DoctorService extends  BaseService<Doctor_Private | Doctor_Public> {
    protected entityConfig: EntityConfig<Doctor_Private | Doctor_Public> = config.entityValues.doctor;

    constructor(
        protected doctorRepository: DoctorRepository,
        protected auditService: LogService
    ) {
        super(doctorRepository, auditService);
    }


    async after(action: ActionType, result: any, args: any[]) {
        const session = args[0] as Session & SessionData;
        const id = args[1];
        const role = session.role;
        if (!role) {
            throw new StatusError(403, 'You are not allowed to perform this action');
        }
        if (role === UserType.ADMIN) {
            return result
        }
        if (role === UserType.DOCTOR) {
            const doctor_id = session.doctorId;
            if (id !== doctor_id) {
                throw new StatusError(403, 'You are not allowed to view another doctor');
            }
            else {
                return result;
            }
        }
        else {
            // Show public data
            if (Array.isArray(result)) {
                return result.map(doctor => {
                    const privateDoctor = doctor as Doctor_Private;
                    return {
                        id: privateDoctor.id,
                        name: privateDoctor.name,
                        specialty: privateDoctor.specialty,
                        qualifications: privateDoctor.qualifications
                    } as Doctor_Public;
                });
            } else {
                const doctor = result as Doctor_Private;
                return {
                    id: doctor.id,
                    name: doctor.name,
                    specialty: doctor.specialty,
                    qualifications: doctor.qualifications
                } as Doctor_Public;
            }
        }
    }

    async before(action: ActionType, args: any) {
        const session = args[0] as Session & SessionData;
        const role = session.role;
        if (!role) {
            throw new StatusError(403, 'You are not allowed to perform this action');
        }
        if (role === UserType.ADMIN) {
            return;
        }
        switch (action) {
            case ActionType.UPDATE:
                await validateUpdate(args);
                break;
        }
    }

}