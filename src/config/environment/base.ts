// src/config/environment/base.ts

import { User } from "../../app/user/user.model";
import { EntityConfig } from "../../app/base/base.model";
import { DBOptions } from "../../database/models/db-options";
import { Availability, Doctor_Private } from "../../app/doctor/doctor.model";
import { Patient } from "../../app/patient/patient.model";
import { Record, Record_Details, Test, Diagnosis, Prescription } from "../../app/record/record.model";
import { Department, Service } from "../../app/department/department.model";
import {Appointment, Appointment_Details} from "../../app/appointment/appointment.model";
import {Log} from "../../app/log/log.model";

export const baseConfig: {
    port: number;
    dbOptions: DBOptions;
    entityValues: {
        log: EntityConfig<Log>;
        user: EntityConfig<User>;
        doctor: EntityConfig<Doctor_Private>;
        availability: EntityConfig<Availability>;
        patient: EntityConfig<Patient>;
        record_details: EntityConfig<Record_Details>;
        test: EntityConfig<Test>;
        diagnosis: EntityConfig<Diagnosis>;
        prescription: EntityConfig<Prescription>;
        department: EntityConfig<Department>;
        service: EntityConfig<Service>;
        record: EntityConfig<Record>;
        appointment: EntityConfig<Appointment>;
        appointment_details: EntityConfig<Appointment_Details>;
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
        log: {
            table_name: 'logs',
            unit: 'Log',
            requiredFields: [
                { name: 'timestamp', type: 'DATE' },
                { name: 'type', type: 'TEXT' },
                { name: 'message', type: 'TEXT' },
                { name: 'details', type: 'JSON' },
                { name: 'user_id', type: 'INTEGER' }
            ]
        },
        user: {
            table_name: 'users',
            unit: 'User',
            requiredFields: [
                { name: 'username', type: 'TEXT' },
                { name: 'password', type: 'TEXT' },
                { name: 'role', type: 'TEXT' }
            ]
        },
        doctor: {
            table_name: 'doctors',
            unit: 'Doctor',
            requiredFields: [
                { name: 'user_id', type: 'INTEGER' },
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
            table_name: '',
            unit: '',
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
                { name: 'user_id', type: 'INTEGER' },
                { name: 'name', type: 'TEXT' },
                { name: 'date_of_birth', type: 'DATE' },
                { name: 'gender', type: 'TEXT' },
                { name: 'emergency_contact', type: 'TEXT' },
                { name: 'allergies', type: 'TEXT[]' },
                { name: 'medical_history', type: 'JSON' }
            ]
        },
        record_details: {
            table_name: '',
            unit: '',
            requiredFields: [
                { name: 'diagnosis', type: 'JSON[]' },
                { name: 'prescriptions', type: 'JSON[]' },
                { name: 'tests', type: 'JSON[]' }
            ]
        },
        diagnosis: {
            table_name: '',
            unit: '',
            requiredFields: [
                { name: 'description', type: 'TEXT' },
                { name: 'symptoms', type: 'TEXT[]' },
                { name: 'doctor_notes', type: 'TEXT' }
            ]
        },
        prescription: {
            table_name: '',
            unit: '',
            requiredFields: [
                { name: 'name', type: 'TEXT' },
                { name: 'dose', type: 'TEXT' },
                { name: 'frequency', type: 'TEXT' },
                { name: 'start_date', type: 'DATE' },
                { name: 'instructions', type: 'TEXT' }
            ]
        },
        test: {
            table_name: '',
            unit: '',
            requiredFields: [
                { name: 'name', type: 'TEXT' },
                { name: 'type', type: 'TEXT' },
                { name: 'result', type: 'TEXT' },
                { name: 'date', type: 'DATE' }
            ]
        },
        department: {
            table_name: 'departments',
            unit: 'Department',
            requiredFields: [
                { name: 'name', type: 'TEXT' },
                { name: 'description', type: 'TEXT' },
                { name: 'services', type: 'JSON[]' },
                { name: 'doctors', type: 'INTEGER[]' }
            ]
        },
        service: {
            table_name: '',
            unit: '',
            requiredFields: [
                { name: 'name', type: 'TEXT' },
                { name: 'type', type: 'TEXT' }
            ]
        },
        record: {
            table_name: 'records',
            unit: 'Record',
            requiredFields: [
                { name: 'doctor_id', type: 'INTEGER' },
                { name: 'patient_id', type: 'INTEGER' },
                { name: 'record_details', type: 'JSON' }
            ]
        },
        appointment: {
            table_name: 'appointments',
            unit: 'Appointment',
            requiredFields: [
                { name: 'doctor_id', type: 'INTEGER' },
                { name: 'patient_id', type: 'INTEGER' },
                { name: 'appointment_details', type: 'JSON' }
            ]
        },
        appointment_details: {
            table_name: '',
            unit: '',
            requiredFields: [
                { name: 'date', type: 'DATE' },
                { name: 'location', type: 'TEXT' },
                { name: 'status', type: 'BOOLEAN' }
            ]
        }
    }
};