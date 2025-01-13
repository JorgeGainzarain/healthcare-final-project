import 'reflect-metadata';

import { Service } from 'typedi';
import { isString, isNumber, toNumber } from 'lodash';

import { AuditRepository } from './audit.repository';
import { Audit } from './audit.model';

@Service()
export class AuditService {

  constructor(private readonly auditRepository: AuditRepository) { }

  async create(msg: string): Promise<Audit> {
    const audit:Audit = {message: msg};

    if (!this.isValidAudit(audit)) {
      return Promise.reject(new Error('AuditInputValidationError'));
    }

    return await this.auditRepository.create(audit);
  }

  async findAll(): Promise<Audit[]> {
    return await this.auditRepository.findAll();
  }

  async findById(auditId: number): Promise<Audit | null> {
    if (!this.isValidId(auditId)) {
      return Promise.reject(new Error('InvalidAuditIdError'));
    }

    return await this.auditRepository.findById(auditId);
  }

  private isValidId(auditId: any): boolean {
    return auditId != null && isNumber(toNumber(auditId)) && toNumber(auditId) > 0;
  }

  private isValidAudit(audit: Audit): boolean {
    return audit != null
      && audit.message != null && isString(audit.message);
  }

}
