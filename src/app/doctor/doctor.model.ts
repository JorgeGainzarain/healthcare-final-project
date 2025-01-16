// src/app/doctor/doctor.model.ts

import { BaseModel } from "../base/base.model";
import { Moment } from "moment";

export enum DaysOfWeek {
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
    Saturday = "Saturday",
    Sunday = "Sunday"
}

export interface Availability {
    days: DaysOfWeek[];
    working_hours: string[]; // e.g. ['08:00-12:00', '14:00-18:00']
    vacations: Date[];
}

export class DoctorAvailability {
    private availability: Availability;

    constructor(availability: Availability) {
        this.availability = availability;
    }

    isAvailable(date: Moment): boolean {
        const dayOfWeek = DaysOfWeek[date.format('dddd') as keyof typeof DaysOfWeek];

        if (this.availability.vacations.includes(date.toDate())) {
            return false;
        }

        if (!this.availability.days.includes(dayOfWeek)) {
            return false;
        }

        let validShift = false;

        for (const shift of this.availability.working_hours) {
            const [startHour, endHour] = shift.split('-');
            const start = date.clone().set({ hour: parseInt(startHour.split(':')[0]), minute: parseInt(startHour.split(':')[1]), second: 0, millisecond: 0 });
            const end = date.clone().set({ hour: parseInt(endHour.split(':')[0]), minute: parseInt(endHour.split(':')[1]), second: 0, millisecond: 0 });
            const current = date.clone().set({ second: 0, millisecond: 0 });

            if (current.isBetween(start.add(1, 'hour'), end.add(1, 'hour'), null, '[]')) {
                validShift = true;
                break;
            }
        }

        return validShift;
    }
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
