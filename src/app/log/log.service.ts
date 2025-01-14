import 'reflect-metadata';

import { Service } from 'typedi';

import { config } from "../../config/environment";
import { LogRepository } from './log.repository';
import { Log } from './log.model';
import {BaseService} from "../base/base.service";
import {EntityConfig} from "../base/base.model";

@Service()
export class LogService extends BaseService<Log>{
  protected entityConfig: EntityConfig<Log> = config.entityValues.log;

  constructor(
      protected readonly logService: LogService,
      protected readonly logRepository: LogRepository
  ) {
    super(logService, logRepository);
  }

  // Custom logic here to avoid circular dependency creating logs of a log creation
  async createLog(log: Log): Promise<Log> {
    return await this.logRepository.create(log);
  }

}
