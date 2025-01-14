// src/config/environment/base.ts

import { User } from "../../app/user/user.model";
import { Audit } from "../../app/audit/audit.model";
import { EntityConfig } from "../../app/base/base.model";
import { DBOptions } from "../../database/models/db-options";
import { Availability, Doctor_Private } from "../../app/doctor/doctor.model";

export const baseConfig: {
    port: number;
    dbOptions: DBOptions;
    entityValues: {
        audit: EntityConfig<Audit>;
        user: EntityConfig<User>;
        doctor: EntityConfig<Doctor_Private>
        availability: EntityConfig<Availability>
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
        },
        doctor: {
            table_name: 'doctors',
            unit: 'Doctor',
            requiredFields: [
                { name: 'name', type: 'TEXT' },
                { name: 'specialty', type: 'TEXT' },
                { name: 'phone', type: 'TEXT' },
                { name: 'email', type: 'TEXT' },
                { name: 'address', type: 'TEXT' },
                { name: 'qualifications', type: 'TEXT' }, // Array
                { name: 'availability', type: 'TEXT' } // JSON
            ]
        },
        availability: {
            table_name: 'availabilities',
            unit: 'Availability',
            requiredFields: [
                { name: 'days', type: 'DATE[]' }, // Array
                { name: 'working_hours', type: 'DATE[]' }, // Array
                { name: 'vacations', type: 'DATE[]' } // Array
            ]
        }
    }
};