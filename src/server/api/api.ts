import { Router } from 'express';
import { Service } from 'typedi';
import {UserController} from "../../app/user/user.controller";
import {DoctorController} from "../../app/doctor/doctor.controller";
import {PatientController} from "../../app/patient/patient.controller";
import {DepartmentController} from "../../app/department/department.controller";
import {RecordController} from "../../app/record/record.controller";
import {AppointmentController} from "../../app/appointment/appointment.controller";
import {LogController} from "../../app/log/log.controller";
import {authenticateJWT} from "../../middleware/authentificate_JWT";

@Service()
export class Api {
  private readonly apiRouter: Router;

  constructor(
      private userController: UserController,
      private doctorController: DoctorController,
      private patientController: PatientController,
      private departmentController: DepartmentController,
      private recordController: RecordController,
      private appointmentController: AppointmentController,
      private logController: LogController
  ) {
    this.apiRouter = Router();
    this.apiRouter.use(authenticateJWT);
    this.apiRouter.use('/', userController.getRouter());
    this.apiRouter.use('/doctor', doctorController.getRouter());
    this.apiRouter.use('/patient', patientController.getRouter());
    this.apiRouter.use('/department', departmentController.getRouter());
    this.apiRouter.use('/record', recordController.getRouter());
    this.apiRouter.use('/appointment', appointmentController.getRouter());
    this.apiRouter.use('/log', logController.getRouter());
  }

  getApiRouter(): Router {
    return this.apiRouter;
  }

}
