import {BaseModel} from "../base/base.model";

export enum UserType {
    ADMIN = 'ADMIN',
    DOCTOR = 'DOCTOR',
    PATIENT = 'PATIENT'
}

export interface User extends BaseModel{
    username: string;
    password: string;
    role: UserType;
}