import { BaseRepository } from "./base.repository";
import { LogService } from "../log/log.service";
import {validateObject, validatePartialObject, validateRequiredParams} from "../../utils/validation";
import { EntityConfig } from "./base.model";
import { StatusError } from "../../utils/status_error";
import { BaseModel } from "./base.model";
import {Log} from "../log/log.model";

export abstract class BaseService<T extends BaseModel> {
    protected constructor(
        protected logService: LogService,
        protected readonly repository: BaseRepository<T>
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
        await this.logService.createLog(log);
    }

    async create(user_id: number, part_entity: Partial<T>): Promise<T> {
        const entity = validateObject(part_entity, this.entityConfig.requiredFields);

        const createdEntity = await this.repository.create(entity);
        await this.logAction(user_id , createdEntity, 'created');
        return createdEntity;
    }

    async update(user_id: number, id: number, part_updates: Partial<T>): Promise<T> {
        validateRequiredParams({ id });
        validatePartialObject(part_updates, this.entityConfig.requiredFields);

        const updatedEntity = await this.repository.update(id, part_updates);
        await this.logAction(user_id, updatedEntity, 'updated');
        return updatedEntity;
    }

    async delete(user_id: number, id: number): Promise<T> {
        validateRequiredParams({ id });
        //console.log('delete id', id);
        const deletedEntity = await this.repository.delete(id);
        await this.logAction(user_id, deletedEntity, 'deleted');
        return deletedEntity;
    }

    async getAll(user_id: number): Promise<T[]> {
        const entities = await this.repository.findAll();
        await this.logAction(user_id, entities, 'retrieved');
        return entities;
    }

    async getById(user_id: number, id: number): Promise<T> {
        validateRequiredParams({ id });

        const entity = await this.repository.findById(id);
        if (!entity) {
            throw new StatusError(404, `${this.entityConfig.unit} with id "${id}" not found.`);
        }
        await this.logAction(user_id, entity, 'retrieved');
        return entity;
    }
}