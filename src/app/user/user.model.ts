import {BaseModel} from "../base/base.model";

export interface User extends BaseModel{
    id?: number;
    username: string;
    password: string;
}