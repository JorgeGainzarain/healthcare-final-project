import { BaseRepository } from "./base.repository";
import { LogService } from "../log/log.service";
import { validateObject, validatePartialObject, validateRequiredParams } from "../../utils/validation";
import { EntityConfig } from "./base.model";
import { StatusError } from "../../utils/status_error";
import { BaseModel } from "./base.model";
import { Log } from "../log/log.model";
import {Session, SessionData} from "express-session";

export enum ActionType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    VIEW = 'view',
    VIEW_ALL = 'viewAll'
}

export abstract class BaseService<T extends BaseModel> {
    protected abstract entityConfig: EntityConfig<T>;

    constructor(
        protected readonly repository: BaseRepository<T>,
        protected logService?: LogService,
    ) {}

    async logAction(user_id: number, entity: T | T[], action: string): Promise<void> {
        if (Array.isArray(entity)) {
            for (const e of entity) {
                await this.logAction(user_id, e, action);
            }
            return;
        }

        const logMessage = `${this.entityConfig.unit} with id ${entity.id} has been ${action}`;
        const log = {
            timestamp: new Date(),
            type: 'INFO',
            message: logMessage,
            details: JSON.stringify(entity),
            user_id: user_id
        } as Log;
        await this.logService?.createLog(log);
    }

    // Hooks to override in subclasses
    protected async before(action: ActionType, args: any[]): Promise<void> {
        return;
    }

    protected async after(action: ActionType, result: any, args: any[]): Promise<any> {
        return result;
    }

    async create(session: Session & Partial<SessionData>, part_entity: Partial<T>): Promise<T> {
        const user_id = session.userId;
        await this.before(ActionType.CREATE, [session, part_entity]);
        let entity = validateObject(part_entity, this.entityConfig.requiredFields);
        const createdEntity = await this.repository.create(entity);
        await this.after(ActionType.CREATE, createdEntity, [session, part_entity]);
        await this.logAction(user_id?? 0, createdEntity, 'created');
        return createdEntity;
    }

    async update(session: Session & Partial<SessionData>, id: number, part_updates: Partial<T>): Promise<T> {
        const user_id = session.userId;
        await this.before(ActionType.UPDATE, [session, id, part_updates]);
        validateRequiredParams({ id });
        validatePartialObject(part_updates, this.entityConfig.requiredFields);
        const updatedEntity = await this.repository.update(id, part_updates);
        await this.after(ActionType.UPDATE, updatedEntity, [session, id, part_updates]);
        await this.logAction(user_id?? 0, updatedEntity, 'updated');
        return updatedEntity;
    }

    async delete(session: Session & Partial<SessionData>, id: number): Promise<T> {
        const user_id = session.userId;
        await this.before(ActionType.DELETE, [session, id]);
        validateRequiredParams({ id });
        const deletedEntity = await this.repository.delete(id);
        await this.after(ActionType.DELETE, deletedEntity, [session, id]);
        await this.logAction(user_id?? 0, deletedEntity, 'deleted');
        return deletedEntity;
    }

    async findById(session: Session & Partial<SessionData>, id: number): Promise<T> {
        const user_id = session.userId;
        await this.before(ActionType.VIEW, [session, id]);
        validateRequiredParams({ id });
        let entity = await this.repository.findById(id);
        if (!entity) {
            throw new StatusError(404, `${this.entityConfig.unit} with id "${id}" not found.`);
        }
        entity = await this.after(ActionType.VIEW, entity, [session, id]);
        await this.logAction(user_id?? 0, entity, 'retrieved');
        return entity;
    }

    async findAll(session: Session & Partial<SessionData>): Promise<T[]> {
        const user_id = session.userId;
        await this.before(ActionType.VIEW_ALL, [session]);
        let entities = await this.repository.findAll();
        entities = await this.after(ActionType.VIEW_ALL, entities, [session]);
        await this.logAction(user_id?? 0, entities, 'retrieved');
        return entities;
    }
}
