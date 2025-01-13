import { Router } from 'express';
import { Service } from 'typedi';
import {UserController} from "../../app/user/user.controller";

@Service()
export class Api {
  private readonly apiRouter: Router;

  constructor(
      private userController: UserController
  ) {
    this.apiRouter = Router();
    this.apiRouter.use('/', userController.getRouter());
  }

  getApiRouter(): Router {
    return this.apiRouter;
  }

}
