import { BaseRepository } from "./base.repository";
import { LogService } from "../log/log.service";
import { validateObject, validatePartialObject, validateRequiredParams } from "../../utils/validation";
import { EntityConfig } from "./base.model";
import { StatusError } from "../../utils/status_error";
import { BaseModel } from "./base.model";
import { Log } from "../log/log.model";

export enum ActionType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    VIEW = 'view',
    VIEW_ALL = 'viewAll'
}

export abstract class BaseService<T extends BaseModel> {
    protected constructor(
        protected readonly repository: BaseRepository<T>,
        protected logService?: LogService,
    ) {}

    protected abstract entityConfig: EntityConfig<T>;

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
        // Default no-op hook
    }

    protected async after(action: ActionType, result: any, args: any[]): Promise<void> {
        // Default no-op hook
    }

    async create(user_id: number, part_entity: Partial<T>): Promise<T> {
        await this.before(ActionType.CREATE, [user_id, part_entity]);
        const entity = validateObject(part_entity, this.entityConfig.requiredFields);
        const createdEntity = await this.repository.create(entity);
        await this.logAction(user_id, createdEntity, 'created');
        await this.after(ActionType.CREATE, createdEntity, [user_id, part_entity]);
        return createdEntity;
    }

    async update(user_id: number, id: number, part_updates: Partial<T>): Promise<T> {
        await this.before(ActionType.UPDATE, [user_id, id, part_updates]);
        validateRequiredParams({ id });
        validatePartialObject(part_updates, this.entityConfig.requiredFields);
        const updatedEntity = await this.repository.update(id, part_updates);
        await this.logAction(user_id, updatedEntity, 'updated');
        await this.after(ActionType.UPDATE, updatedEntity, [user_id, id, part_updates]);
        return updatedEntity;
    }

    async delete(user_id: number, id: number): Promise<T> {
        await this.before(ActionType.DELETE, [user_id, id]);
        validateRequiredParams({ id });
        const deletedEntity = await this.repository.delete(id);
        await this.logAction(user_id, deletedEntity, 'deleted');
        await this.after(ActionType.DELETE, deletedEntity, [user_id, id]);
        return deletedEntity;
    }

    async findById(user_id: number, id: number): Promise<T> {
        await this.before(ActionType.VIEW, [user_id, id]);
        validateRequiredParams({ id });
        const entity = await this.repository.findById(id);
        if (!entity) {
            throw new StatusError(404, `${this.entityConfig.unit} with id "${id}" not found.`);
        }
        await this.logAction(user_id, entity, 'retrieved');
        await this.after(ActionType.VIEW, entity, [user_id, id]);
        return entity;
    }

    async findAll(user_id: number): Promise<T[]> {
        await this.before(ActionType.VIEW_ALL, [user_id]);
        const entities = await this.repository.findAll();
        await this.logAction(user_id, entities, 'retrieved');
        await this.after(ActionType.VIEW_ALL, entities, [user_id]);
        return entities;
    }
}
