import {BaseController} from "../base/base.controller";
import {Doctor_Private, Doctor_Public} from "./doctor.model";
import {DoctorService} from "./doctor.service";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {Service} from "typedi";
import {NextFunction, Request, Response} from "express";
import {Session, SessionData} from "express-session";
import {createResponse} from "../../utils/response";

@Service()
export class DoctorController extends BaseController<Doctor_Private | Doctor_Public> {
    protected entityConfig: EntityConfig<Doctor_Private | Doctor_Public> = config.entityValues.doctor;

    constructor(
        protected doctorService: DoctorService
    ) {
        super(doctorService);
        this.getRouter().get('', this.getAll.bind(this));
        this.getRouter().get('/:id', this.getById.bind(this));
        this.getRouter().put('/:id', this.update.bind(this));
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (req.query) {
            return this.findByField(req, res, next);
        }
        else {
            return super.getAll(req, res, next);
        }
    }

    async findByField(req: Request, res: Response, next: NextFunction): Promise<void> {
        const query = Object.assign({}, req.query);

        return this.doctorService.findByField(req.session as Session & SessionData, query)
            .then((doctors: Doctor_Private | Doctor_Public[]) => {
                res.status(200).json(createResponse('success', this.entityConfig.unit + ' retrieved successfully', doctors));
            })
            .catch((error: any) => {
                next(error);
            });
    }
}