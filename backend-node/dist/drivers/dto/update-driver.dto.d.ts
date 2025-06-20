import { CreateDriverDto } from './create-driver.dto';
import { DriverStatus } from '../entities/driver.entity';
declare const UpdateDriverDto_base: import("@nestjs/common").Type<Partial<CreateDriverDto>>;
export declare class UpdateDriverDto extends UpdateDriverDto_base {
    status?: DriverStatus;
}
export {};
