export declare class HealthController {
    getHealth(): {
        status: string;
        timestamp: string;
        message: string;
        version: string;
    };
    getInfo(): {
        name: string;
        version: string;
        description: string;
        author: string;
        node_version: string;
        uptime: number;
    };
}
