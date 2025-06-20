import { Repository } from 'typeorm';
import { CheckinRecord } from './entities/checkin-record.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { SearchCheckinDto } from './dto/search-checkin.dto';
export declare class CheckinService {
    private checkinRepository;
    constructor(checkinRepository: Repository<CheckinRecord>);
    create(createCheckinDto: CreateCheckinDto, driverId: number): Promise<CheckinRecord>;
    findAll(searchDto: SearchCheckinDto): Promise<{
        data: CheckinRecord[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(id: number): Promise<CheckinRecord>;
    findByDriver(driverId: number, limit?: number): Promise<CheckinRecord[]>;
    remove(id: number): Promise<void>;
    getTodayCheckins(driverId: number): Promise<CheckinRecord[]>;
    getCheckinStats(driverId?: number, startDate?: string, endDate?: string): Promise<{
        total: number;
        typeStats: any[];
    }>;
}
