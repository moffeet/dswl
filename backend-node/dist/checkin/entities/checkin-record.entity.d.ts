import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
export declare enum CheckinType {
    DELIVERY = "delivery",
    PICKUP = "pickup",
    VISIT = "visit"
}
export declare class CheckinRecord {
    id: number;
    driverId: number;
    customerId: number;
    checkinType: CheckinType;
    longitude: number;
    latitude: number;
    address: string;
    photos: string[];
    remark: string;
    checkinTime: Date;
    createdAt: Date;
    updatedAt: Date;
    driver: User;
    customer: Customer;
}
