import { StatusError } from './status_error';

export function validateRequiredParams<T extends Object>(params: Partial<T>): void {
    const requiredFields = Object.keys(params) as (keyof T)[];
    const missingParams = requiredFields.filter(field => params[field] === undefined || params[field] === null || params[field] === '');
    if (missingParams.length > 0) {
        throw new StatusError(400, `Missing required parameter(s): ${missingParams.join(', ')}`);
    }
}

export function validateObject<T extends Object>(obj: Partial<T>, requiredFields: { name: keyof T; type: string }[]): T {
    const invalidFields = requiredFields.filter(field => {
        const value = obj[field.name];
        return !(field.name in obj) || (field.type === 'TEXT' && value == '');
    });

    if (invalidFields.length > 0) {
        throw new StatusError(400, `Invalid object. Missing fields: ${invalidFields.map(field => field.name).join(', ')}`);
    }

    validateRequiredParams(obj);
    return obj as T;
}

export function validatePartialObject<T extends Object>(obj: Partial<T>, requiredFields: { name: keyof T; type: string }[]): Partial<T> {
    const invalidFields = (Object.keys(obj) as (keyof T)[]).map(key => {
        const field = requiredFields.find(f => f.name === key);
        return !field || (field.type === 'TEXT' && obj[key] == '') ? { name: key } : null;
    }).filter(field => field !== null) as { name: keyof T }[];

    if (invalidFields.length > 0) {
        throw new StatusError(400, `Invalid object. Missing fields: ${invalidFields.map(field => field.name).join(', ')}`);
    }

    return obj;
}