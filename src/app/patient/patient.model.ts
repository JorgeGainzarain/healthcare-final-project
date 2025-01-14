import { BaseModel } from "../base/base.model";

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

export interface Record_Details {
    diagnosis: Diagnosis[];
    prescriptions: Prescription[];
    tests: Test[];
}

export interface Patient extends BaseModel {
  id: number;
  name: string;
  date_of_birth: Date;
  gender: string;
  emergency_contact: string;
  allergies: string[];
  medical_history: Record_Details[];
}