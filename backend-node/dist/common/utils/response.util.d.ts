export declare class ResponseUtil {
    static success<T>(data?: T, message?: string): {
        code: number;
        message: string;
        data: T;
        timestamp: string;
    };
    static page<T>(data: T[], total: number, page: number, limit: number, message?: string): {
        code: number;
        message: string;
        data: {
            list: T[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        timestamp: string;
    };
    static error(message?: string, code?: number): {
        code: number;
        message: string;
        data: any;
        timestamp: string;
    };
}
