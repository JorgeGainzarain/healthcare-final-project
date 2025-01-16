import {NextFunction, Router, Request, Response} from "express";
import {createResponse} from "../../utils/response";
import {BaseService} from "./base.service";
import {EntityConfig} from "./base.model";
import {BaseModel} from "./base.model";

export abstract class BaseController<T extends BaseModel> {
    protected abstract entityConfig: EntityConfig<T>;

    protected readonly companyRouter: Router;

    protected constructor(
        private readonly service: BaseService<T>
    ) {
        this.companyRouter = Router();
    }


    getRouter(): Router {
        return this.companyRouter;
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        return this.service.create(req.session.userId ?? 0, req.body)
            .then((entity: T) => {
                res.status(201).json(createResponse('success', this.entityConfig.unit + ' created successfully', entity));
            })
            .catch((error: any) => {
                next(error);
            })
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        return this.service.update(req.session.userId ?? 0, parseInt(req.params.id), req.body)
            .then((entity: T) => {
                res.status(200).json(createResponse('success', this.entityConfig.unit + ' updated successfully', entity));
            })
            .catch((error: any) => {
                next(error);
            });
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        return this.service.delete(req.session.userId ?? 0, parseInt(req.params.id))
            .then((entity: T) => {
                res.status(200).json(createResponse('success', this.entityConfig.unit + ' deleted successfully', entity));
            })
            .catch((error: any) => {
                next(error);
            });
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        return this.service.findAll(req.session.userId ?? 0)
            .then((entities: T[]) => {
                res.status(200).json(createResponse('success', this.entityConfig.unit + ' retrieved successfully', entities));
            })
            .catch((error: any) => {
                next(error);
            });
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        return this.service.findById(req.session.userId ?? 0, parseInt(req.params.id))
            .then((entity: T) => {
                res.status(200).json(createResponse('success', this.entityConfig.unit + ' retrieved successfully', entity));
            })
            .catch((error: any) => {
                next(error);
            });
    }

}