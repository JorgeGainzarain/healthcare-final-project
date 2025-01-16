import { BaseModel } from "../base/base.model";
import {Record_Details} from "../record/record.model";

export interface Patient extends BaseModel {
  user_id: number;
  name: string;
  date_of_birth: Date;
  gender: string;
  emergency_contact: string;
  allergies: string[];
  medical_history: Record_Details[];
}