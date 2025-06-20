import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
export declare class DriversService {
    private driversRepository;
    constructor(driversRepository: Repository<Driver>);
    create(createDriverDto: CreateDriverDto): Promise<Driver>;
    findAll(): Promise<Driver[]>;
    findById(id: number): Promise<Driver>;
    findByUserId(userId: number): Promise<Driver>;
    update(id: number, updateDriverDto: UpdateDriverDto): Promise<Driver>;
    updateLocation(userId: number, updateLocationDto: UpdateLocationDto): Promise<Driver>;
    updateStatus(userId: number, status: DriverStatus): Promise<Driver>;
    remove(id: number): Promise<void>;
    findActiveDrivers(): Promise<Driver[]>;
    getDriverInfo(userId: number): Promise<Driver>;
}
