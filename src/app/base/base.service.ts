import { BaseRepository } from "./base.repository";
import { AuditService } from "../audit/audit.service";
import {validateObject, validatePartialObject, validateRequiredParams} from "../../utils/validation";
import { EntityConfig } from "./base.model";
import { StatusError } from "../../utils/status_error";

export abstract class BaseService<T extends { id?: number }> {
    protected constructor(
        protected auditService: AuditService,
        protected readonly repository: BaseRepository<T>
    ) {}

    protected abstract entityConfig: EntityConfig<T>;

    async auditAction(entity: T | T[], action: string): Promise<void> {
        if (Array.isArray(entity)) {
            for (const e of entity) {
                await this.auditAction(e, action);
            }
            return;
        }

        const auditMessage = `${this.entityConfig.unit} with id ${entity.id} has been ${action}`;
        await this.auditService.create(auditMessage);
    }

    async create(part_entity: Partial<T>): Promise<T> {
        const entity = validateObject(part_entity, this.entityConfig.requiredFields);

        const createdEntity = await this.repository.create(entity);
        await this.auditAction(createdEntity, 'created');
        return createdEntity;
    }

    async update(id: number, part_updates: Partial<T>): Promise<T> {
        validateRequiredParams({ id });
        validatePartialObject(part_updates, this.entityConfig.requiredFields);

        const updatedEntity = await this.repository.update(id, part_updates);
        await this.auditAction(updatedEntity, 'updated');
        return updatedEntity;
    }

    async delete(id: number): Promise<T> {
        validateRequiredParams({ id });
        //console.log('delete id', id);
        const deletedEntity = await this.repository.delete(id);
        await this.auditAction(deletedEntity, 'deleted');
        return deletedEntity;
    }

    async getAll(): Promise<T[]> {
        const entities = await this.repository.findAll();
        await this.auditAction(entities, 'retrieved');
        return entities;
    }

    async getById(id: number): Promise<T> {
        validateRequiredParams({ id });

        const entity = await this.repository.findById(id);
        if (!entity) {
            throw new StatusError(404, `${this.entityConfig.unit} with id "${id}" not found.`);
        }
        await this.auditAction(entity, 'retrieved');
        return entity;
    }
}