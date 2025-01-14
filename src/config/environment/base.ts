// src/config/environment/base.ts

import { User } from "../../app/user/user.model";
import { Audit } from "../../app/audit/audit.model";
import { EntityConfig } from "../../app/base/base.model";
import { DBOptions } from "../../database/models/db-options";
import { Availability, Doctor_Private } from "../../app/doctor/doctor.model";
import { Patient, Record_Details, Test, Diagnosis, Prescription } from "../../app/patient/patient.model";

export const baseConfig: {
    port: number;
    dbOptions: DBOptions;
    entityValues: {
        audit: EntityConfig<Audit>;
        user: EntityConfig<User>;
        doctor: EntityConfig<Doctor_Private>;
        availability: EntityConfig<Availability>;
        patient: EntityConfig<Patient>;
        record_details: EntityConfig<Record_Details>;
        test: EntityConfig<Test>;
        diagnosis: EntityConfig<Diagnosis>;
        prescription: EntityConfig<Prescription>;
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
                { name: 'qualifications', type: 'TEXT[]' },
                { name: 'availability', type: 'JSON' }
            ]
        },
        availability: {
            table_name: 'availabilities',
            unit: 'Availability',
            requiredFields: [
                { name: 'days', type: 'DATE[]' },
                { name: 'working_hours', type: 'DATE[]' },
                { name: 'vacations', type: 'DATE[]' }
            ]
        },
        patient: {
            table_name: 'patients',
            unit: 'Patient',
            requiredFields: [
                { name: 'name', type: 'TEXT' },
                { name: 'date_of_birth', type: 'DATE' },
                { name: 'gender', type: 'TEXT' },
                { name: 'emergency_contact', type: 'TEXT' },
                { name: 'allergies', type: 'TEXT[]' },
                { name: 'medical_history', type: 'JSON' }
            ]
        },
        record_details: {
            table_name: 'record_details',
            unit: 'Record_Details',
            requiredFields: [
                { name: 'diagnosis', type: 'JSON[]' },
                { name: 'prescriptions', type: 'JSON[]' },
                { name: 'tests', type: 'JSON[]' }
            ]
        },
        test: {
            table_name: 'tests',
            unit: 'Test',
            requiredFields: [
                { name: 'name', type: 'TEXT' },
                { name: 'type', type: 'TEXT' },
                { name: 'result', type: 'TEXT' },
                { name: 'date', type: 'DATE' }
            ]
        },
        diagnosis: {
            table_name: 'diagnoses',
            unit: 'Diagnosis',
            requiredFields: [
                { name: 'description', type: 'TEXT' },
                { name: 'symptoms', type: 'TEXT[]' },
                { name: 'doctor_notes', type: 'TEXT' }
            ]
        },
        prescription: {
            table_name: 'prescriptions',
            unit: 'Prescription',
            requiredFields: [
                { name: 'name', type: 'TEXT' },
                { name: 'dose', type: 'TEXT' },
                { name: 'frequency', type: 'TEXT' },
                { name: 'start_date', type: 'DATE' },
                { name: 'instructions', type: 'TEXT' }
            ]
        }
    }
};