import {BaseModel} from "../base/base.model";

export interface Service {
    name: string;
    type: string;
}

export interface Department extends BaseModel {
    name: string;
    description: string;
    services: Service[];
    doctors: number[]; // Ids of the doctors
}