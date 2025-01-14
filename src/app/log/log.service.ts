import 'reflect-metadata';

import { Service } from 'typedi';
import { isString, isNumber, toNumber } from 'lodash';

import { LogRepository } from './log.repository';
import { Log } from './log.model';

@Service()
export class LogService {

  constructor(private readonly logRepository: LogRepository) { }

  async create(msg: string): Promise<Log> {
    const log:Log = {message: msg};

    if (!this.isValidLog(log)) {
      return Promise.reject(new Error('logInputValidationError'));
    }

    return await this.logRepository.create(log);
  }

  async findAll(): Promise<Log[]> {
    return await this.logRepository.findAll();
  }

  async findById(logId: number): Promise<Log | null> {
    if (!this.isValidId(logId)) {
      return Promise.reject(new Error('InvalidLogIdError'));
    }

    return await this.logRepository.findById(logId);
  }

  private isValidId(logId: any): boolean {
    return logId != null && isNumber(toNumber(logId)) && toNumber(logId) > 0;
  }

  private isValidLog(log: Log): boolean {
    return log != null
      && log.message != null && isString(log.message);
  }

}
