import {BaseModel} from "../base/base.model";

export interface Appointment extends BaseModel {
    doctor_id: number;
    patient_id: number;
    appointment_details: Appointment_Details
}

export interface Appointment_Details {
    date: Date,
    location: string,
    status: boolean
}