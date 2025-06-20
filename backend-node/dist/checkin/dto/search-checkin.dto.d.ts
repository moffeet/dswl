import { CheckinType } from '../entities/checkin-record.entity';
export declare class SearchCheckinDto {
    driverId?: number;
    customerId?: number;
    checkinType?: CheckinType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
