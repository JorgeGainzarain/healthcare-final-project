import {BaseController} from "../base/base.controller";
import {Patient} from "./patient.model";
import {PatientService} from "./patient.service";
import {EntityConfig} from "../base/base.model";
import {config} from "../../config/environment";
import {Service} from "typedi";
import {NextFunction, Request, Response} from "express";
import {Session, SessionData} from "express-session";
import {createResponse} from "../../utils/response";

@Service()
export class PatientController extends BaseController<Patient> {
    protected entityConfig: EntityConfig<Patient> = config.entityValues.patient;

    constructor(
        protected patientService: PatientService
    ) {
        super(patientService);
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

        return this.patientService.findByField(req.session as Session & SessionData, query)
            .then((patients: Patient[]) => {
                res.status(200).json(createResponse('success', this.entityConfig.unit + ' retrieved successfully', patients));
            })
            .catch((error: any) => {
                next(error);
            });
    }

}