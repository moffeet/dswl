import { User } from '../../users/entities/user.entity';
export declare enum DriverStatus {
    AVAILABLE = "available",
    BUSY = "busy",
    OFFLINE = "offline"
}
export declare class Driver {
    id: number;
    userId: number;
    driverCode: string;
    name: string;
    phone: string;
    idCard: string;
    vehicleNumber: string;
    vehicleType: string;
    status: DriverStatus;
    currentLongitude: number;
    currentLatitude: number;
    lastLocationUpdateAt: Date;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
