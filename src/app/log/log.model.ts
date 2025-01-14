import {BaseModel} from "../base/base.model";

enum LogType {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR'
}

export interface Log extends BaseModel{
  timestamp: Date,
  type: LogType,
  message: string,
  details: string,
  user_id: number
}