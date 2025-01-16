import {BaseModel} from "../base/base.model";

export interface Notification extends BaseModel{
    title: string;
    message: string;
    user_ids: number[];
    timestamp: Date;
}