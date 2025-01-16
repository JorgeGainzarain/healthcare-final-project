// src/app/doctor/doctor.model.ts

import { BaseModel } from "../base/base.model";
import { Moment } from "moment";

export interface Availability {
    days: Moment[];
    working_hours: Moment[];
    vacations: Moment[];
}

export interface Doctor_Public extends BaseModel {
  name: string;
  specialty: string;
  qualifications: string[];
  availability: Availability;
}

export interface Doctor_Private extends Doctor_Public {
  user_id: number,
  phone: string;
  email: string;
  address: string;
}