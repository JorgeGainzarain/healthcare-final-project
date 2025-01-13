// src/config/environment/development.ts
import { baseConfig } from './base';

export const development = {
  ...baseConfig,
  dbOptions: {
    ...baseConfig.dbOptions,
    database: 'node-api-project.db'
  }
};