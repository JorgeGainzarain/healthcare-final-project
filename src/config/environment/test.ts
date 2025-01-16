// src/config/environment/test.ts
import { baseConfig } from './base';

export const test = {
  ...baseConfig,
  dbOptions: {
    ...baseConfig.dbOptions,
    database: 'node-api-project-test.db',
    port: 1000
  },
  entityValues: {
    ...baseConfig.entityValues,
    test: {
      table_name: 'test_entities',
      unit: 'TestEntity',
      requiredFields: [
        { name: 'name', type: 'TEXT' },
      ]
    }
  }
};