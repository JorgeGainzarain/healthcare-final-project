// src/utils/Status_error.ts
export class StatusError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}