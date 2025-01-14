import {BaseModel} from "../base/base.model";

export interface Record extends BaseModel {
    doctor_id: number,
    patient_id: number,
    record_details: Record_Details
}

export interface Record_Details {
    diagnosis: Diagnosis[];
    prescriptions: Prescription[];
    tests: Test[];
}

export interface Diagnosis {
    id: number;
    description: string;
    symptoms: string[];
    doctor_notes: string;
}

export interface Prescription {
    id: number;
    name: string;
    dose: string | number;
    frequency: string;
    start_date: Date;
    instructions: string;
}

export interface Test {
    id: number;
    name: string;
    type: string;
    result: string | number;
    date: Date;
}