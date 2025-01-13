// src/config/environment/base.ts

import { User } from "../../app/user/user.model";
import { Audit } from "../../app/audit/audit.model";
import { EntityConfig } from "../../app/base/base.model";
import { DBOptions } from "../../database/models/db-options";

export const baseConfig: {
    port: number;
    dbOptions: DBOptions;
    entityValues: {
        audit: EntityConfig<Audit>;
        user: EntityConfig<User>;
    };
} = {
    port: 3000,

    dbOptions: {
        user: 'dbUser',
        host: 'localhost',
        database: 'node-api-project.db',
        password: 'dbPassword',
        port: 5432
    },

    entityValues: {
        audit: {
            table_name: 'audits',
            unit: 'Audit',
            requiredFields: [
                { name: 'message', type: 'TEXT' }
            ]
        },
        user: {
            table_name: 'users',
            unit: 'User',
            requiredFields: [
                { name: 'username', type: 'TEXT' },
                { name: 'password', type: 'TEXT' }
            ]
        }
    }
};