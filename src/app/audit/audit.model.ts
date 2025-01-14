import {BaseModel} from "../base/base.model";

export interface Audit extends BaseModel{
  message: string;
}