export interface BaseModel {
    id?: number;
}

export interface EntityConfig<T extends object> {
    table_name: string;
    unit: string;
    requiredFields: { name: keyof T; type: string }[];
    defaultEntity?: T
}
