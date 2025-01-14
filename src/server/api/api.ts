import { Router } from 'express';
import { Service } from 'typedi';
import {UserController} from "../../app/user/user.controller";
import {DoctorController} from "../../app/doctor/doctor.controller";
import {PatientController} from "../../app/patient/patient.controller";

@Service()
export class Api {
  private readonly apiRouter: Router;

  constructor(
      private userController: UserController,
      private doctorController: DoctorController,
      private patientController: PatientController
  ) {
    this.apiRouter = Router();
    this.apiRouter.use('/', userController.getRouter());
    this.apiRouter.use('/doctor', doctorController.getRouter());
    this.apiRouter.use('/patient', patientController.getRouter());
  }

  getApiRouter(): Router {
    return this.apiRouter;
  }

}
