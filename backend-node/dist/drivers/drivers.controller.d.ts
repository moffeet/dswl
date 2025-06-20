import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Driver, DriverStatus } from './entities/driver.entity';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    create(createDriverDto: CreateDriverDto): Promise<Driver>;
    findAll(): Promise<Driver[]>;
    findActiveDrivers(): Promise<Driver[]>;
    getMyDriverInfo(req: any): Promise<Driver>;
    updateLocation(updateLocationDto: UpdateLocationDto, req: any): Promise<Driver>;
    updateStatus(status: DriverStatus, req: any): Promise<Driver>;
    findOne(id: number): Promise<Driver>;
    update(id: number, updateDriverDto: UpdateDriverDto): Promise<Driver>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
