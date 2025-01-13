import { Service } from 'typedi';
import { UserService } from './user.service';
import { User } from "./user.model";
import { BaseController } from "../base/base.controller";
import { config } from "../../config/environment";
import { NextFunction, Request, Response } from "express";
import {createResponse} from "../../utils/response";

@Service()
export class UserController extends BaseController<User> {
    protected entityConfig = config.entityValues.user;

    constructor(
        protected userService: UserService
    ) {
        super(userService);
        this.getRouter().post('/register', this.register.bind(this));
        this.getRouter().post('/login', this.login.bind(this));
        this.getRouter().post('/logout', this.logout.bind(this));
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        return this.userService.register(req.body)
            .then((entity: Omit<User, 'password'>) => {
                res.status(201).json(createResponse('success', 'registration successful', entity));
            })
            .catch((error: any) => {
                next(error);
            });
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        return this.userService.login(req.body)
            .then(({ user, token } : {user: Omit<User,'password'>, token: string}) => {
                req.session.token = token;
                res.status(200).json(createResponse('success', 'login successful', { user, token }));
            })
            .catch((error: any) => {
                next(error);
            });
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (!req.session.token) {
            res.status(200).json(createResponse('success', 'no active session'));
            return;
        }
        req.session.destroy((err: any) => {
            if (err) {
                next(err);
            }
            res.status(200).json(createResponse('success', 'logout successful'));
        });
    }

}