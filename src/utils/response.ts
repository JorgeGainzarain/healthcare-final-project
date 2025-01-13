// src/utils/responseUtil.ts
export function createResponse(status: string, message: string, data: any = null) {
    return { status, message, data };
}