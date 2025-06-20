import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { SearchCheckinDto } from './dto/search-checkin.dto';
import { CheckinRecord } from './entities/checkin-record.entity';
export declare class CheckinController {
    private readonly checkinService;
    constructor(checkinService: CheckinService);
    create(createCheckinDto: CreateCheckinDto, req: any): Promise<CheckinRecord>;
    findAll(searchDto: SearchCheckinDto): Promise<{
        data: CheckinRecord[];
        total: number;
        page: number;
        limit: number;
    }>;
    getMyCheckins(req: any, limit?: number): Promise<CheckinRecord[]>;
    getTodayCheckins(req: any): Promise<CheckinRecord[]>;
    getStats(driverId?: number, startDate?: string, endDate?: string): Promise<{
        total: number;
        typeStats: any[];
    }>;
    findOne(id: number): Promise<CheckinRecord>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
