import { CheckinType } from '../entities/checkin-record.entity';
export declare class CreateCheckinDto {
    customerId: number;
    checkinType: CheckinType;
    longitude: number;
    latitude: number;
    address: string;
    photos: string[];
    remark?: string;
}
